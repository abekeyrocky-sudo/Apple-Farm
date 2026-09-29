export default function handler(req, res) {
  const { userId, amount, rewardId } = req.query;
  console.log('[GigaPub Postback Received]:', { userId, amount, rewardId });
  return res.status(200).json({ ok: true, status: 'success' });
}
