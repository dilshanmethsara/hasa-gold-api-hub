const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { game, playerId, serverId } = req.body;

  if (!game || !playerId) {
    return res.status(400).json({ error: 'game and playerId are required' });
  }

  try {
    // ─── FREE FIRE (API Games Indonesia) ───
    if (game === 'freefire') {
      const merchantId = process.env.APIGAMES_MERCHANT_ID;
      const secretKey = process.env.APIGAMES_SECRET_KEY;
      
      if (!merchantId || !secretKey) return res.status(500).json({ error: 'API Games credentials not configured on server' });

      const signature = crypto.createHash('md5').update(merchantId + secretKey + playerId).digest('hex');
      const apiUrl = `https://v1.apigames.id/merchant/${merchantId}/cek-username/freefire?user_id=${playerId}&signature=${signature}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 1 && data.data && data.data.is_valid) {
        return res.status(200).json({
          success: true,
          name: data.data.username,
          game: "Free Fire",
          id: playerId
        });
      }
      return res.status(404).json({ success: false, message: "Player ID not found" });
    }

    // ─── MOBILE LEGENDS ───
    if (game === 'mobilelegends') {
      if (!serverId) return res.status(400).json({ error: 'serverId is required for Mobile Legends' });
      const apiUrl = `https://api.isan.eu.org/nickname/ml?id=${playerId}&server=${serverId}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success && data.name) {
        return res.status(200).json({ success: true, name: data.name, game: "Mobile Legends", id: playerId });
      }
      return res.status(404).json({ success: false, message: "ML Player not found" });
    }

    // ─── BLOOD STRIKE (RapidAPI) ───
    if (game === 'bloodstrike') {
      const apiKey = process.env.RAPIDAPI_KEY;
      if (!apiKey) return res.status(500).json({ error: 'RAPIDAPI_KEY not configured on server' });

      const apiUrl = `https://id-game-checker.p.rapidapi.com/blood-strike/${playerId}`;
      const response = await fetch(apiUrl, {
        headers: {
          "x-rapidapi-host": "id-game-checker.p.rapidapi.com",
          "x-rapidapi-key": apiKey
        }
      });
      const data = await response.json();

      if (data && (data.username || (data.data && data.data.username))) {
        return res.status(200).json({
          success: true,
          name: data.username || data.data.username,
          game: "Blood Strike",
          id: playerId
        });
      }
      return res.status(404).json({ success: false, message: "Blood Strike ID not found" });
    }

    return res.status(400).json({ error: 'Unsupported game' });
  } catch (error) {
    console.error('❌ verify-id error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
