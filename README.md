# NoobToDev

## Executar a aplicação integrada localmente

1. Configure `backend/.env` com `DATABASE_URL` (PostgreSQL) e um `JWT_SECRET` forte. A referência está em [.env.example](./.env.example).
2. Em um terminal, inicie a API:

   ```bash
   cd backend
   npm install
   npm run db:migrate
   npm run start:dev
   ```

3. Em outro terminal, inicie o Angular:

   ```bash
   cd frontend
   npm install
   npm start
   ```

4. Abra `http://localhost:4200`. O proxy do Angular encaminha chamadas `/api/*` para `http://localhost:3000`; autenticação, trilhas, lições, respostas e perfil usam dados do backend/PostgreSQL, sem contas ou respostas simuladas.

Para popular uma base de desenvolvimento vazia, execute `npm run db:seed` em `backend` uma vez após as migrações. O seed cria conteúdo de exemplo; não o execute em uma base com progresso que precise preservar.
