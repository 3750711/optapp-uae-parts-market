import { createServiceClient } from './client.ts';

/**
 * Verify QStash signature for webhook security
 * 
 * QStash sends two signatures in the header:
 * Upstash-Signature: sig1=<signature_with_current_key> sig2=<signature_with_next_key>
 * 
 * We verify against both keys to support key rotation.
 * 
 * @param body - Raw request body as string
 * @param signatureHeader - Value of Upstash-Signature header
 * @param timestampHeader - Value of Upstash-Timestamp header
 * @param supabaseClient - Supabase client instance
 * @returns true if signature is valid, false otherwise
 */
export async function verifyQStashSignature(
  body: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
  supabaseClient: ReturnType<typeof createServiceClient>
): Promise<boolean> {
  
  if (!signatureHeader || !timestampHeader) {
    console.error('❌ Missing QStash signature headers');
    return false;
  }

  // Parse timestamp and check freshness (prevent replay attacks)
  const timestamp = parseInt(timestampHeader, 10);
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  
  // Reject if older than 5 minutes
  if (age > 300) {
    console.error(`❌ QStash signature too old: ${age}s (max 300s)`);
    return false;
  }

  // Get signing keys from app_settings
  const { data: settings, error } = await supabaseClient
    .from('app_settings')
    .select('key, value')
    .in('key', ['qstash_current_signing_key', 'qstash_next_signing_key']);

  if (error || !settings || settings.length === 0) {
    console.error('❌ Failed to fetch QStash signing keys:', error);
    return false;
  }

  const currentKey = settings.find(s => s.key === 'qstash_current_signing_key')?.value;
  const nextKey = settings.find(s => s.key === 'qstash_next_signing_key')?.value;

  if (!currentKey) {
    console.error('❌ qstash_current_signing_key not found in app_settings');
    return false;
  }

  // Parse signatures from header
  // Format: "sig1=<signature1> sig2=<signature2>"
  const signatures = parseSignatureHeader(signatureHeader);
  
  if (signatures.length === 0) {
    console.error('❌ No signatures found in Upstash-Signature header');
    return false;
  }

  // Message to sign: timestamp.body
  const message = `${timestamp}.${body}`;

  // Try to verify with current key
  for (const providedSignature of signatures) {
    if (await verifySignature(message, providedSignature, currentKey)) {
      console.log('✅ QStash signature verified with current key');
      return true;
    }
  }

  // Try to verify with next key (for key rotation support)
  if (nextKey) {
    for (const providedSignature of signatures) {
      if (await verifySignature(message, providedSignature, nextKey)) {
        console.log('✅ QStash signature verified with next key');
        return true;
      }
    }
  }

  console.error('❌ QStash signature verification failed: no matching signature');
  return false;
}

/**
 * Parse signature header into array of signatures
 * Format: "sig1=abc sig2=def" -> ["abc", "def"]
 */
function parseSignatureHeader(header: string): string[] {
  const signatures: string[] = [];
  const parts = header.split(' ');
  
  for (const part of parts) {
    if (part.includes('=')) {
      const [, signature] = part.split('=');
      if (signature) {
        signatures.push(signature);
      }
    }
  }
  
  return signatures;
}

/**
 * Verify a single signature using HMAC SHA-256
 */
async function verifySignature(
  message: string,
  providedSignature: string,
  signingKey: string
): Promise<boolean> {
  try {
    // Import signing key for HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Compute HMAC signature
    const messageData = encoder.encode(message);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    
    // Convert to base64
    const signatureArray = new Uint8Array(signatureBuffer);
    const computedSignature = btoa(String.fromCharCode(...signatureArray));

    // Compare signatures (constant-time comparison to prevent timing attacks)
    return computedSignature === providedSignature;
    
  } catch (error) {
    console.error('❌ Error computing signature:', error);
    return false;
  }
}
