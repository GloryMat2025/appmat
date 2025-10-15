export function csrf(){
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    const token = req.get('x-csrf-token') || req.body?.csrf_token;
    const cookie = req.cookies?.csrf_token;
    if (!token || !cookie || token !== cookie){
      return res.status(403).json({ error: 'bad_csrf' });
    }
    next();
  };
}
