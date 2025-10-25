"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const group_routes_1 = __importDefault(require("./routes/group.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const seedData_1 = require("./lib/seedData");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'StudyConnect API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            tasks: '/api/tasks',
            groups: '/api/groups',
            users: '/api/users'
        }
    });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.use('/api/groups', group_routes_1.default);
app.use('/api/users', user_routes_1.default);
// Error handling
app.use(error_middleware_1.errorHandler);
app.listen(PORT, async () => {
    console.log(`🚀 StudyConnect API running on http://localhost:${PORT}`);
    // Seed initial data
    await (0, seedData_1.seedData)();
});
exports.default = app;
