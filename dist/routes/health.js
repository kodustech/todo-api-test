"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /v1/health → 200 OK { "status": "ok" }
router.get('/health', auth_1.optionalAuth, (req, res) => {
    const response = { status: 'ok' };
    res.json(response);
});
exports.default = router;
//# sourceMappingURL=health.js.map