// Mark requests that require second factor if user has 2FA enabled and session lacks 'passed2fa'
export function require2FA(){
  return (req, res, next) => {
    if (!req.user) return next();
    const passed = req.session?.passed2fa || false;
    // In a real app, check DB whether user has 2FA enabled, here we just trust a flag set at /api/2fa/status call result
    // For demo purposes, we look at req.session.need2fa which should be set at login if the user has 2FA enabled.
    if (req.session?.need2fa && !passed){
      return res.status(401).json({ error:'pending_2fa', userId: req.user.id });
    }
    next();
  };
}
