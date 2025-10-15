import express from 'express';

const router = express.Router();

// In-memory mock store for demo/testing only
const mockReservations = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

router.post('/', (req, res) => {
  const { items, ttlMs } = req.body || {};
  const ttl = typeof ttlMs === 'number' ? ttlMs : DEFAULT_TTL;
  const id = 'mock-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
  const expiresAt = Date.now() + ttl;
  mockReservations.set(id, { id, items: items || [], expiresAt });
  res.json({ ok: true, reservationId: id, expiresAt });
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;
  if (mockReservations.has(id)) {
    mockReservations.delete(id);
    return res.json({ ok: true });
  }
  res.status(404).json({ ok: false, error: 'not found' });
});

router.get('/', (_req, res) => {
  res.json(Array.from(mockReservations.values()));
});

export default router;
