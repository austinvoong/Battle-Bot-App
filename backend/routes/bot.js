const express = require('express');
const router = express.Router();

// Example command handling
router.get('/:command', (req, res) => {
  const command = req.params.command;
  console.log(`Received command: ${command}`);
  // Here, you can handle commands and interact with the ESP32
  res.send(`Command "${command}" received.`);
});

module.exports = router;
