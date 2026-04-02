import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import log from '../utils/logger.js';
import config from '../utils/config.js';

const templates = {
  'node-api': {
    files: {
      'src/controller/auth.controller.js': `import { createAccount, authenticateUser, authenticateAdmin, ensureDefaultAdmin } from '../services/auth.service.js';

export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await createAccount({ name, email, password, role: 'user' });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authenticateUser({ email, password });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export const signOut = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Signed out successfully.' });
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authenticateAdmin({ email, password });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export const createDefaultAdmin = async (req, res) => {
  try {
    const result = await ensureDefaultAdmin();
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};`,
      'src/controller/user.controller.js': `import User from '../models/user.model.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};`,
      'src/middleware/auth.middleware.js': `import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const getToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || 'voltx_secret_key',
    { expiresIn: '7d' }
  );
};

export const generateToken = getToken;

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, token missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'voltx_secret_key');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    next();
  };
};`,
      'src/models/user.model.js': `import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;`,
      'src/routes/auth.routes.js': `import { Router } from 'express';
import { adminLogin, createDefaultAdmin, signIn, signOut, signUp } from '../controller/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/admin-login', adminLogin);
router.post('/default-admin', createDefaultAdmin);
router.post('/signout', protect, signOut);

export default router;`,
      'src/routes/user.routes.js': `import { Router } from 'express';
import { deleteUser, getMe, getUserById, getUsers, updateUser } from '../controller/user.controller.js';
import { authorizeRoles, protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/me', getMe);
router.get('/', authorizeRoles('admin'), getUsers);
router.get('/:id', authorizeRoles('admin'), getUserById);
router.patch('/:id', authorizeRoles('admin'), updateUser);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

export default router;`,
      'src/services/auth.service.js': `import User from '../models/user.model.js';
import { generateToken } from '../middleware/auth.middleware.js';

const sanitizeUser = (user) => {
  const plain = user.toObject ? user.toObject() : user;
  delete plain.password;
  return plain;
};

export const createAccount = async ({ name, email, password, role = 'user' }) => {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required.');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email is already registered.');
  }

  const user = await User.create({ name, email, password, role });
  return {
    success: true,
    message: 'Account created successfully.',
    token: generateToken(user),
    data: sanitizeUser(user),
  };
};

export const authenticateUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || user.role === 'admin') {
    throw new Error('Invalid email or password.');
  }

  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return {
    success: true,
    message: 'Signed in successfully.',
    token: generateToken(user),
    data: sanitizeUser(user),
  };
};

export const authenticateAdmin = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const user = await User.findOne({ email, role: 'admin' }).select('+password');
  if (!user) {
    throw new Error('Admin account not found.');
  }

  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid admin credentials.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return {
    success: true,
    message: 'Admin signed in successfully.',
    token: generateToken(user),
    data: sanitizeUser(user),
  };
};

export const ensureDefaultAdmin = async () => {
  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@voltx.local';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345';
  const name = process.env.DEFAULT_ADMIN_NAME || 'Default Admin';

  let admin = await User.findOne({ email, role: 'admin' });
  if (!admin) {
    admin = await User.create({ name, email, password, role: 'admin' });
    return {
      success: true,
      message: 'Default admin created successfully.',
      data: sanitizeUser(admin),
    };
  }

  return {
    success: true,
    message: 'Default admin already exists.',
    data: sanitizeUser(admin),
  };
};`,
      'src/services/user.service.js': `import User from '../models/user.model.js';

export const listUsers = () => User.find().select('-password');
export const getUserById = (id) => User.findById(id).select('-password');
export const updateUserById = (id, payload) => User.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).select('-password');
export const deleteUserById = (id) => User.findByIdAndDelete(id);`,
      'src/app.js': `import express from 'express';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Something went wrong.',
  });
});

export default app;`,
      'src/server.js': `import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { ensureDefaultAdmin } from './services/auth.service.js';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || '';

const startServer = async () => {
  try {
    if (MONGODB_URI) {
      await mongoose.connect(MONGODB_URI);
    }

    if (process.env.DEFAULT_ADMIN_EMAIL && process.env.DEFAULT_ADMIN_PASSWORD) {
      await ensureDefaultAdmin();
    }

    app.listen(PORT, () => {});
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();`,
      '.env.example': `PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/voltx-node-api
JWT_SECRET=replace_this_with_a_strong_secret
DEFAULT_ADMIN_NAME=Default Admin
DEFAULT_ADMIN_EMAIL=admin@voltx.local
DEFAULT_ADMIN_PASSWORD=Admin@12345`,
      'package.json': `{
  "name": "node-api-starter",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.7.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.14"
  }
}`,
    },
    post: async (dir) => {
      await execa('npm', ['install'], { cwd: dir });
    },
  },
  'react-app': {
    post: async (dir) => {
      await execa('npx', ['create-react-app', '.'], { cwd: dir });
    },
  },
  'cli-tool': {
    files: {
      'cli.js': `#!/usr/bin/env node\nconsole.log('Hello CLI!');`,
      'package.json': `{"name":"cli-tool","bin":{"cli":"cli.js"},"type":"module"}`,
    },
    post: async (dir) => {
      await execa('npm', ['install'], { cwd: dir });
    },
  },
};

const dev = new Command('dev');

dev
  .command('scaffold <template>')
  .description('Generate project boilerplate (node-api, react-app, cli-tool)')
  .action(async (template) => {
    if (!templates[template]) {
      log.error('Unknown template. Choose from: ' + Object.keys(templates).join(', '));
      return;
    }
    const { dir } = await inquirer.prompt({
      type: 'input',
      name: 'dir',
      message: 'Target directory:',
      default: template,
    });
    if (await fs.pathExists(dir)) {
      log.error('Directory already exists.');
      return;
    }
    await fs.mkdirp(dir);
    if (templates[template].files) {
      for (const [file, content] of Object.entries(templates[template].files)) {
        await fs.outputFile(path.join(dir, file), content);
      }
    }
    if (templates[template].post) {
      const spinner = ora('Setting up project...').start();
      try {
        await templates[template].post(dir);
        spinner.succeed('Project ready!');
      } catch (e) {
        spinner.fail('Setup failed');
        log.error(e.message);
            return;
      }
    }
    log.success('Scaffolded ' + template + ' in ' + dir);
  })
  .addHelpText('after', `\nExample:\n  voltX dev scaffold node-api`);

dev
  .command('env diff <file1> <file2>')
  .description('Compare two .env files and highlight missing/changed keys')
  .action(async (file1, file2) => {
    const parseEnv = (str) => Object.fromEntries(str.split(/\r?\n/).filter(Boolean).map(l => l.split('=')).filter(a => a.length === 2));
    try {
      const env1 = parseEnv(await fs.readFile(file1, 'utf8'));
      const env2 = parseEnv(await fs.readFile(file2, 'utf8'));
      const allKeys = new Set([...Object.keys(env1), ...Object.keys(env2)]);
      for (const key of allKeys) {
        if (!(key in env1)) log.warn(`Missing in ${file1}: ${key}`);
        else if (!(key in env2)) log.warn(`Missing in ${file2}: ${key}`);
        else if (env1[key] !== env2[key]) log.info(chalk.yellow(`Changed: ${key}\n  ${file1}: ${env1[key]}\n  ${file2}: ${env2[key]}`));
      }
      log.success('Diff complete.');
    } catch (e) {
      log.error(e.message);
    }
  })
  .addHelpText('after', `\nExample:\n  voltX dev env diff .env.example .env`);

dev
  .command('git clean')
  .description('Interactive stale local branch cleanup')
  .action(async () => {
    try {
      const { stdout } = await execa('git', ['branch', '--format=%(refname:short)']);
      const branches = stdout.split(/\r?\n/).filter(b => b && b !== 'main' && b !== 'master');
      if (!branches.length) return log.info('No local branches to clean.');
      const { toDelete } = await inquirer.prompt({
        type: 'checkbox',
        name: 'toDelete',
        message: 'Select branches to delete:',
        choices: branches,
      });
      for (const branch of toDelete) {
        await execa('git', ['branch', '-D', branch]);
        log.success('Deleted branch: ' + branch);
      }
      if (!toDelete.length) log.info('No branches deleted.');
    } catch (e) {
      log.error(e.message);
    }
  })
  .addHelpText('after', `\nExample:\n  voltX dev git clean`);

dev
  .command('serve <dir>')
  .description('Spin up a quick static file server')
  .option('--port <port>', 'Port to serve on', () => config.get('defaultPort', 5000))
  .action(async (dir, opts) => {
    const port = parseInt(opts.port, 10) || 5000;
    const express = (await import('express')).default;
    const app = express();
    app.use(express.static(dir));
    app.listen(port, () => {
      log.success(`Serving ${dir} at http://localhost:${port}`);
    });
  })
  .addHelpText('after', `\nExample:\n  voltX dev serve public --port 8080`);

export default dev;
