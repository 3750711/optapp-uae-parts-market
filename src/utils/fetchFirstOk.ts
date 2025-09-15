export async function fetchFirstOk(tries: Array<() => Promise<Response>>, timeoutMs = 15000): Promise<Response> {
  const run = (fn: () => Promise<Response>) => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort('timeout'), timeoutMs);
    const p = fn().finally(() => clearTimeout(to));
    return { p, abort: () => ctrl.abort('loser') };
  };
  const rs = tries.map(run);
  return new Promise<Response>((resolve, reject) => {
    let done = false, errors: any[] = [];
    rs.forEach((r, i) => {
      r.p.then((res) => {
        if (done) return;
        if (res.ok) {
          done = true; rs.forEach((x, j) => j !== i && x.abort());
          resolve(res);
        } else {
          errors.push(new Error('HTTP '+res.status));
          if (errors.length === rs.length) reject(new Error(errors.map(e=>e.message).join(', ')));
        }
      }).catch((e) => {
        if (done) return;
        errors.push(e);
        if (errors.length === rs.length) reject(new Error(errors.map(e=>String(e)).join(', ')));
      });
    });
  });
}