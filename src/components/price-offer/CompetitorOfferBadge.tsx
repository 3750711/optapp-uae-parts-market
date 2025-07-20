
interface CompetitorOfferBadgeProps {
  maxOtherOffer: number;
  compact?: boolean;
}

export const CompetitorOfferBadge = ({ maxOtherOffer, compact = false }: CompetitorOfferBadgeProps) => {
  if (maxOtherOffer <= 0) return null;

  if (compact) {
    return (
      <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium border border-orange-200">
        ${maxOtherOffer}
      </div>
    );
  }

  return (
    <div className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-md text-sm font-medium border border-orange-200">
      другой ${maxOtherOffer}
    </div>
  );
};
