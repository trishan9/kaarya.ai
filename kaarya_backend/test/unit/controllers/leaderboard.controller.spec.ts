import { ApiError } from 'src/common/errors/api-error';
import { LEADERBOARD_MESSAGES } from 'src/constants/messages.constants';
import { LeaderboardController } from 'src/controllers/leaderboard.controller';
import { LeaderboardService } from 'src/services/leaderboard.service';

describe('LeaderboardController', () => {
  let controller: LeaderboardController;
  let leaderboardService: jest.Mocked<LeaderboardService>;

  beforeEach(() => {
    leaderboardService = {
      getLeaderboard: jest.fn(),
    } as unknown as jest.Mocked<LeaderboardService>;

    controller = new LeaderboardController(leaderboardService);
  });

  it('should return leaderboard for valid query', async () => {
    leaderboardService.getLeaderboard.mockResolvedValue({
      scope: 'global',
      rows: [],
      me: null,
      meta: {
        page: 1,
        size: 20,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null,
      },
    } as never);

    const result = await controller.getLeaderboard(
      { user: { id: 'u1', role: 'student' } as never },
      { scope: 'global', page: 1, size: 20 },
    );

    expect(leaderboardService.getLeaderboard).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      expect.objectContaining({ scope: 'global', page: 1, size: 20 }),
    );
    expect(result).toEqual({
      success: true,
      message: LEADERBOARD_MESSAGES.FETCH_SUCCESS,
      data: expect.any(Object),
    });
  });

  it('should reject invalid query', async () => {
    await expect(
      controller.getLeaderboard(
        { user: { id: 'u1' } as never },
        { page: 0, size: 200 } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

