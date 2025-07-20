
interface CompetitorOfferBadgeProps {
  maxOtherOffer: number;
  compact?: boolean;
}

export const CompetitorOfferBadge = ({ maxOtherOffer, compact = false }: CompetitorOfferBadgeProps) => {
  if (maxOtherOffer <= 0) return null;

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-orange-100 to-amber-50 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold border border-orange-200/60 shadow-sm backdrop-blur-sm">
        ${maxOtherOffer}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-25 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-orange-200/60 shadow-sm backdrop-blur-sm">
      другой ${maxOtherOffer}
    </div>
  );
};
