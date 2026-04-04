import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            getCurrentUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates login requests to AuthService', async () => {
    authService.login.mockResolvedValue({ accessToken: 'token', user: { id: 1, username: 'admin', displayName: 'Admin' } } as never);

    const result = await controller.login({ username: 'admin', password: 'secret' });

    expect(authService.login).toHaveBeenCalledWith({ username: 'admin', password: 'secret' });
    expect(result.accessToken).toBe('token');
  });

  it('loads the current user from request context', async () => {
    authService.getCurrentUser.mockResolvedValue({ user: { id: 1, username: 'admin', displayName: 'Admin' } } as never);

    const result = await controller.me({ user: { id: 1 } } as never);

    expect(authService.getCurrentUser).toHaveBeenCalledWith(1);
    expect(result.user.username).toBe('admin');
  });
});
