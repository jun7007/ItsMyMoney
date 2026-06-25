export function pinAuth(req, res, next) {
  const requiredPin = process.env.ACCESS_PIN;
  if (!requiredPin || !req.path.startsWith('/api')) {
    return next();
  }

  const providedPin = req.headers['x-access-pin'];
  if (providedPin !== requiredPin) {
    return res.status(401).json({ error: 'Invalid or missing access PIN' });
  }

  next();
}
