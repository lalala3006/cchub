import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { UserAccount } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<UserAccount>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserAccount),
          useValue: {
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepository = module.get(getRepositoryToken(UserAccount));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('seeds a default user when none exist', async () => {
    userRepository.count.mockResolvedValue(0);
    userRepository.create.mockImplementation((value) => value as UserAccount);
    userRepository.save.mockResolvedValue({ id: 1, username: 'admin' } as UserAccount);

    await service.onModuleInit();

    expect(userRepository.create).toHaveBeenCalled();
    expect(userRepository.save).toHaveBeenCalled();
  });

  it('returns a token and public user on valid login', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 1,
      username: 'admin',
      displayName: 'Admin',
      passwordHash: 'salt:hashed',
    } as UserAccount);
    jest.spyOn(service as never, 'verifyPassword').mockReturnValue(true as never);
    jest.spyOn(service as never, 'signToken').mockReturnValue('signed-token' as never);

    const result = await service.login({ username: 'admin', password: 'secret' });

    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: 1,
        username: 'admin',
        displayName: 'Admin',
      },
    });
  });
});
