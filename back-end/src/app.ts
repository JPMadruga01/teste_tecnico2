import express from 'express';
import routes from './routes/index';

const app = express();

app.use(express.json());
app.use('/api', routes);

app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ ok: true, message: 'API is running' });
});

export default app;
