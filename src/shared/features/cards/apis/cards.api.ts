import { db } from '@/shared/db';
import { ICard, CardStatus, CardType } from '@/shared/types/card';

interface GetCardsParams {
  page: number;
  limit: number;
  searchQuery?: string;
  statusFilter?: CardStatus | CardType | 'all';
}

export const getCards = async ({ page, limit, searchQuery, statusFilter }: GetCardsParams): Promise<ICard[]> => {
  const offset = (page - 1) * limit;
  const now = new Date();
  const expiringSoonThreshold = new Date();
  expiringSoonThreshold.setDate(now.getDate() + 7);

  // We fetch NFC cards, left join with monthly subscriptions AND active parking entry
  const results = await db.query.nfcCards.findMany({
    with: {
      subscriptions: {
        orderBy: (subs, { desc }) => [desc(subs.createdAt)],
        limit: 1,
      },
      entries: {
        orderBy: (entries, { desc }) => [desc(entries.entryTime)],
        limit: 1,
      }

    },
    where: (cards, { and, or, like, eq }) => {
      const filters = [];

      if (searchQuery) {
        filters.push(
          or(
            like(cards.uid, `%${searchQuery}%`),
            like(cards.registeredPlate, `%${searchQuery}%`)
          )
        );
      }


      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'locked') {
          filters.push(eq(cards.status, 'locked'));
        } else if (statusFilter === 'monthly') {
          filters.push(eq(cards.cardType, 'thang'));
        } else if (statusFilter === 'visitor') {
          filters.push(eq(cards.cardType, 'luot'));
        }
      }

      return filters.length > 0 ? and(...filters) : undefined;
    },

    limit,
    offset,
  });

  return results.map((card) => {
    const subscription = card.subscriptions?.[0];
    const activeEntry = card.entries?.[0];
    let status: CardStatus = (card.status as unknown as CardStatus) || 'active';
    
    if (card.status === 'locked') {
      status = 'locked';
    } else if (subscription) {
      if (subscription.endDate < now) {
        status = 'expired';
      } else if (subscription.endDate < expiringSoonThreshold) {
        status = 'expiring_soon';
      } else {
        status = 'active';
      }
    }

    return {
      id: card.uid,
      serialId: card.uid,
      licensePlate: activeEntry?.plateText || subscription?.vehiclePlate || card.registeredPlate || 'Vãng lai',
      holderName: subscription?.customerName || (card.cardType === 'luot' ? 'Khách vãng lai' : 'Chưa đăng ký'),
      phoneNumber: subscription?.customerPhone || '',
      type: card.cardType === 'thang' ? 'monthly' : 'visitor',
      status: status,
      usageStatus: card.status === 'using' ? 'in' : 'out',
      activePlate: activeEntry?.plateText,
      activeEntryId: activeEntry?.id,
      expiredAt: subscription?.endDate?.toISOString().split('T')[0] || 'N/A',
      vehicleType: subscription?.vehicleType || '',
    };
  });
};

