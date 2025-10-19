import express from 'express';
import routes from './routes';

const app = express();

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API is running' });
});

export default app;
