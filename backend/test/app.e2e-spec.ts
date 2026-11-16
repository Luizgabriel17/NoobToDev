import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const previousJwtSecret = process.env.JWT_SECRET;
  const prisma = {
    usuario: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    licao: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest
        .fn()
        .mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })),
    },
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'e2e-test-secret-not-for-production';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    jwt = app.get(JwtService);
  });

  it('protects lesson routes from unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/lessons').expect(401);
  });

  it('allows authenticated users to read lessons', async () => {
    const token = await jwt.signAsync({ sub: 1, papel: 'ESTUDANTE' });
    return request(app.getHttpServer())
      .get('/lessons')
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .expect([]);
  });

  it('protects user routes from unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/users').expect(401);
  });

  it('restricts user routes to administrators', async () => {
    const token = await jwt.signAsync({ sub: 1, papel: 'ESTUDANTE' });
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows administrators to read users', async () => {
    const token = await jwt.signAsync({ sub: 1, papel: 'ADMIN' });
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect([]);
  });

  it('allows administrators to create lessons', async () => {
    const token = await jwt.signAsync({ sub: 1, papel: 'ADMIN' });
    await request(app.getHttpServer())
      .post('/lessons')
      .set('Authorization', `Bearer ${token}`)
      .send({ moduloId: 2, titulo: '  Introdução  ', ordem: 1 })
      .expect(201)
      .expect({
        id: 1,
        moduloId: 2,
        titulo: 'Introdução',
        ordem: 1,
        publicada: false,
      });
  });

  it('rejects invalid lesson input', async () => {
    const token = await jwt.signAsync({ sub: 1, papel: 'ADMIN' });
    return request(app.getHttpServer())
      .post('/lessons')
      .set('Authorization', `Bearer ${token}`)
      .send({ moduloId: -1 })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    if (previousJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousJwtSecret;
    }
  });
});
