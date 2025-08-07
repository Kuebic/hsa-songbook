# MongoDB/Mongoose Testing Guide

## Overview

This comprehensive guide covers best practices for testing MongoDB/Mongoose APIs with modern JavaScript testing frameworks, focusing on Vitest integration, performance considerations, and real-world patterns.

## Table of Contents

1. [MongoDB Memory Server Integration](#mongodb-memory-server-integration)
2. [Mongoose Testing Patterns](#mongoose-testing-patterns)
3. [Vitest + Mongoose Integration](#vitest--mongoose-integration)
4. [API Testing Strategies](#api-testing-strategies)
5. [Performance Testing](#performance-testing)
6. [Common Pitfalls](#common-pitfalls)
7. [Resources](#resources)

## MongoDB Memory Server Integration

### Overview

MongoDB Memory Server spins up an actual MongoDB server programmatically from within Node.js for testing or mocking during development. By default, it holds data in memory, with a fresh process taking about 7MB of memory.

### Installation

```bash
# Choose one package (they differ only in default configuration)
npm install --save-dev mongodb-memory-server
# OR for core package without auto-download
npm install --save-dev mongodb-memory-server-core
```

### Basic Setup

```typescript
// test/database-handler.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export const connect = async (): Promise<void> => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log('Test MongoDB connected');
};

export const closeDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod?.stop();
    console.log('Test MongoDB connection closed');
  }
};

export const clearDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(collection => collection.deleteMany({}))
  );
  console.log('Test MongoDB collections cleared');
};
```

### Configuration Best Practices

```typescript
// Advanced configuration
const mongod = await MongoMemoryServer.create({
  binary: {
    version: '7.0.14',
    downloadDir: './mongodb-binaries',
  },
  instance: {
    port: 27017, // or use 0 for random port
    dbName: 'test-db',
    auth: false, // Enable if testing authentication
  },
});
```

### Environment Variable Support

```typescript
// Check environment variable to decide server usage
const useMemoryServer = process.env.RUN_IN_MEMORY === 'true';
const mongoUri = useMemoryServer 
  ? mongod.getUri() 
  : process.env.MONGODB_TEST_URI;
```

### Performance Considerations

- **Speed**: In-memory operations are incredibly fast for testing
- **Isolation**: Each test can have its own isolated MongoDB instance
- **Memory**: Fresh server takes ~7MB, scales with data size
- **CI/CD**: Works with any CI runner that supports Node.js
- **Parallel Testing**: Use `--maxWorkers 4` or `--runInBand` to limit database load

### Cleanup Strategies

```typescript
// Global teardown for test suites
afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

// Per-test cleanup
afterEach(async () => {
  await clearDatabase();
});
```

## Mongoose Testing Patterns

### Schema Validation Testing

Official Mongoose documentation (v8.16.5) emphasizes that validation is middleware running as a pre('save') hook by default.

#### Testing Built-in Validators

```typescript
// user.model.ts
const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [120, 'Age cannot exceed 120'],
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'suspended'],
      message: '{VALUE} is not a valid status'
    }
  }
});

// user.test.ts
describe('User Model Validation', () => {
  it('should require email field', async () => {
    const user = new User({ age: 25 });
    const error = await user.validate().catch(err => err);
    
    expect(error.errors.email).toBeDefined();
    expect(error.errors.email.message).toBe('Email is required');
  });

  it('should validate age range', async () => {
    const user = new User({ email: 'test@test.com', age: -1 });
    const error = await user.validate().catch(err => err);
    
    expect(error.errors.age.message).toBe('Age cannot be negative');
  });

  it('should validate enum values', async () => {
    const user = new User({ 
      email: 'test@test.com', 
      status: 'invalid-status' 
    });
    const error = await user.validate().catch(err => err);
    
    expect(error.errors.status.message).toContain('is not a valid status');
  });
});
```

#### Testing Custom Validators

```typescript
// Synchronous custom validator
const phoneSchema = new Schema({
  phone: {
    type: String,
    validate: {
      validator: function(v: string) {
        return /\d{3}-\d{3}-\d{4}/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid phone number!`
    }
  }
});

// Asynchronous custom validator
const emailSchema = new Schema({
  email: {
    type: String,
    validate: {
      validator: async function(email: string) {
        const user = await User.findOne({ email });
        return !user; // Return false if user exists (duplicate)
      },
      message: 'Email already exists'
    }
  }
});

// Testing custom validators
describe('Custom Validation', () => {
  it('should validate phone format', async () => {
    const contact = new Contact({ phone: '123-456-789' }); // Invalid format
    const error = await contact.validate().catch(err => err);
    
    expect(error.errors.phone.message).toContain('not a valid phone number');
  });

  it('should validate unique email asynchronously', async () => {
    await User.create({ email: 'existing@test.com' });
    
    const newUser = new User({ email: 'existing@test.com' });
    const error = await newUser.validate().catch(err => err);
    
    expect(error.errors.email.message).toBe('Email already exists');
  });
});
```

### Testing Middleware (Pre/Post Hooks)

```typescript
// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Post-save middleware for logging
userSchema.post('save', function(doc) {
  console.log(`User ${doc._id} has been saved`);
});

// Testing middleware
describe('User Middleware', () => {
  it('should hash password before saving', async () => {
    const plainPassword = 'testpassword123';
    const user = new User({ 
      email: 'test@test.com', 
      password: plainPassword 
    });
    
    await user.save();
    
    expect(user.password).not.toBe(plainPassword);
    expect(await bcrypt.compare(plainPassword, user.password)).toBe(true);
  });

  it('should not rehash password if not modified', async () => {
    const user = await User.create({ 
      email: 'test@test.com', 
      password: 'testpassword123' 
    });
    
    const originalHash = user.password;
    user.email = 'newemail@test.com';
    await user.save();
    
    expect(user.password).toBe(originalHash);
  });
});
```

### Testing Virtuals and Methods

```typescript
// Schema with virtuals and methods
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email });
};

// Testing virtuals and methods
describe('User Virtuals and Methods', () => {
  it('should compute full name virtual', () => {
    const user = new User({ 
      firstName: 'John', 
      lastName: 'Doe' 
    });
    
    expect(user.fullName).toBe('John Doe');
  });

  it('should compare password correctly', async () => {
    const user = new User({ 
      email: 'test@test.com',
      password: 'testpassword123' 
    });
    await user.save();
    
    expect(await user.comparePassword('testpassword123')).toBe(true);
    expect(await user.comparePassword('wrongpassword')).toBe(false);
  });

  it('should find user by email using static method', async () => {
    await User.create({ email: 'test@test.com' });
    
    const foundUser = await User.findByEmail('test@test.com');
    expect(foundUser.email).toBe('test@test.com');
  });
});
```

### Factory Pattern for Test Data

```typescript
// test/factories/user.factory.ts
export const createUserData = (overrides = {}) => ({
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
  status: 'active',
  ...overrides,
});

export const createUser = async (overrides = {}) => {
  return await User.create(createUserData(overrides));
};

// Usage in tests
describe('User Factory', () => {
  it('should create user with default data', async () => {
    const user = await createUser();
    expect(user.email).toBe('test@example.com');
  });

  it('should create user with custom data', async () => {
    const user = await createUser({ 
      email: 'custom@test.com',
      age: 25 
    });
    expect(user.email).toBe('custom@test.com');
    expect(user.age).toBe(25);
  });
});
```

## Vitest + Mongoose Integration

### Configuration Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    isolate: true, // Ensures test isolation
    pool: 'threads',
    maxConcurrency: 5, // Limit concurrent tests for database
    testTimeout: 10000, // Longer timeout for database operations
  },
});
```

### Global Setup

```typescript
// src/test/setup.ts
import { beforeEach, afterEach, afterAll } from 'vitest';
import { connect, clearDatabase, closeDatabase } from './database-handler';

beforeEach(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});
```

### Using vitest-mms Package

```bash
npm install --save-dev vitest-mms
```

```typescript
// vitest.config.ts with vitest-mms
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["vitest-mms/globalSetup"],
    setupFile: ["vitest-mms/mongoose/setupFile"],
    vitestMms: {
      mongodbMemoryServerOptions: {
        binary: {
          version: '7.0.14',
        },
        instance: {
          dbName: 'test-database',
        },
      },
    },
  },
});
```

### Custom Environment for Database Connections

```typescript
// vitest-environment-mongoose.ts
import type { Environment } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

export default <Environment>{
  name: "mongoose-env",
  transformMode: "ssr",
  async setup() {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    
    return {
      async teardown() {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
          await mongod.stop();
        }
      },
    };
  },
};
```

### Test Isolation Strategies

```typescript
// Mock vs Real Database Testing
describe('User Service', () => {
  // Using real database (integration test)
  describe('with real database', () => {
    it('should create user successfully', async () => {
      const userData = { email: 'test@test.com', name: 'Test User' };
      const user = await UserService.create(userData);
      
      expect(user._id).toBeDefined();
      expect(user.email).toBe(userData.email);
    });
  });

  // Using mocked database (unit test)
  describe('with mocked database', () => {
    it('should handle creation errors', async () => {
      vi.spyOn(User.prototype, 'save').mockRejectedValue(
        new Error('Database error')
      );
      
      await expect(
        UserService.create({ email: 'test@test.com' })
      ).rejects.toThrow('Database error');
    });
  });
});
```

### Parallel Test Execution Considerations

```typescript
// vitest.config.ts for database testing
export default defineConfig({
  test: {
    // Disable parallelism for database tests to prevent conflicts
    fileParallelism: false,
    // Or limit workers
    maxWorkers: 1,
    // Use pool options for better control
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork for database tests
      },
    },
  },
});
```

## API Testing Strategies

### Supertest Integration with Express + Mongoose

```typescript
// test/api.test.ts
import request from 'supertest';
import { app } from '../server/app';
import { User } from '../server/models/user.model';

describe('User API', () => {
  beforeEach(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        age: 30,
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBe(userData.name);
      expect(response.body._id).toBeDefined();

      // Verify in database
      const user = await User.findById(response.body._id);
      expect(user.email).toBe(userData.email);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = { name: 'Test User' }; // Missing required email

      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('Email is required');
    });
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      // Create test data
      await User.create([
        { email: 'user1@test.com', name: 'User 1' },
        { email: 'user2@test.com', name: 'User 2' },
      ]);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body[0].email).toBe('user1@test.com');
    });

    it('should handle pagination', async () => {
      // Create multiple users
      const users = Array.from({ length: 25 }, (_, i) => ({
        email: `user${i}@test.com`,
        name: `User ${i}`,
      }));
      await User.create(users);

      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .expect(200);

      expect(response.body.users.length).toBe(10);
      expect(response.body.totalPages).toBe(3);
      expect(response.body.currentPage).toBe(1);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update existing user', async () => {
      const user = await User.create({
        email: 'original@test.com',
        name: 'Original Name',
      });

      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put(`/api/users/${user._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.email).toBe(user.email); // Should remain unchanged
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .put(`/api/users/${fakeId}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete existing user', async () => {
      const user = await User.create({
        email: 'delete@test.com',
        name: 'Delete Me',
      });

      await request(app)
        .delete(`/api/users/${user._id}`)
        .expect(204);

      // Verify deletion
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });
});
```

### Testing Complex Queries and Aggregations

```typescript
describe('User Analytics API', () => {
  beforeEach(async () => {
    // Create test data with various ages and statuses
    const users = [
      { email: 'young1@test.com', age: 20, status: 'active' },
      { email: 'young2@test.com', age: 25, status: 'active' },
      { email: 'adult1@test.com', age: 35, status: 'active' },
      { email: 'adult2@test.com', age: 40, status: 'inactive' },
      { email: 'senior@test.com', age: 65, status: 'active' },
    ];
    await User.create(users);
  });

  it('should return age group statistics', async () => {
    const response = await request(app)
      .get('/api/users/analytics/age-groups')
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: 'young',
          count: 2,
          averageAge: 22.5,
        }),
        expect.objectContaining({
          _id: 'adult',
          count: 2,
          averageAge: 37.5,
        }),
        expect.objectContaining({
          _id: 'senior',
          count: 1,
          averageAge: 65,
        }),
      ])
    );
  });

  it('should return users with complex filters', async () => {
    const response = await request(app)
      .get('/api/users/search?minAge=30&status=active')
      .expect(200);

    expect(response.body.length).toBe(2); // adult1 and senior
    response.body.forEach(user => {
      expect(user.age).toBeGreaterThanOrEqual(30);
      expect(user.status).toBe('active');
    });
  });
});
```

### Testing Error Conditions

```typescript
describe('Error Handling', () => {
  it('should handle database connection errors', async () => {
    // Mock database connection error
    vi.spyOn(mongoose, 'connect').mockRejectedValue(
      new Error('Connection failed')
    );

    const response = await request(app)
      .get('/api/users')
      .expect(500);

    expect(response.body.message).toContain('Database connection error');
  });

  it('should handle validation errors properly', async () => {
    const invalidUser = {
      email: 'invalid-email', // Invalid email format
      age: -5, // Invalid age
    };

    const response = await request(app)
      .post('/api/users')
      .send(invalidUser)
      .expect(400);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.email).toBeDefined();
    expect(response.body.errors.age).toBeDefined();
  });

  it('should handle duplicate key errors', async () => {
    const userData = { email: 'duplicate@test.com', name: 'Test User' };

    // Create first user
    await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    // Try to create duplicate
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(409);

    expect(response.body.message).toContain('already exists');
  });
});
```

### Authentication and Authorization Testing

```typescript
describe('Protected Routes', () => {
  let authToken: string;
  let user: any;

  beforeEach(async () => {
    user = await User.create({
      email: 'auth@test.com',
      password: 'testpassword123',
      role: 'user',
    });

    // Get authentication token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'auth@test.com',
        password: 'testpassword123',
      });

    authToken = loginResponse.body.token;
  });

  it('should allow access with valid token', async () => {
    await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });

  it('should deny access without token', async () => {
    await request(app)
      .get('/api/users/profile')
      .expect(401);
  });

  it('should deny access with invalid token', async () => {
    await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('should check role-based permissions', async () => {
    // Regular user trying to access admin route
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(403);

    // Update user role to admin
    await User.findByIdAndUpdate(user._id, { role: 'admin' });

    // Get new token with admin role
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'auth@test.com',
        password: 'testpassword123',
      });

    // Now should have access
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminLoginResponse.body.token}`)
      .expect(200);
  });
});
```

## Performance Testing

### MongoDB Aggregation Pipeline Testing

Based on official MongoDB documentation and performance best practices:

```typescript
describe('Performance Testing', () => {
  beforeEach(async () => {
    // Create large dataset for performance testing
    const users = Array.from({ length: 10000 }, (_, i) => ({
      email: `user${i}@test.com`,
      age: Math.floor(Math.random() * 60) + 18,
      status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      score: Math.floor(Math.random() * 100),
    }));

    await User.insertMany(users);
  });

  it('should execute aggregation pipeline efficiently', async () => {
    const startTime = Date.now();

    const pipeline = [
      // $match early in pipeline for efficiency
      { $match: { status: 'active', age: { $gte: 25 } } },
      
      // Group users by age ranges
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 30] }, then: 'young' },
                { case: { $lt: ['$age', 50] }, then: 'middle' },
              ],
              default: 'senior',
            },
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          totalScore: { $sum: '$score' },
        },
      },
      
      // Sort results
      { $sort: { count: -1 } },
    ];

    const result = await User.aggregate(pipeline);
    const executionTime = Date.now() - startTime;

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(1000); // Should complete within 1 second

    // Verify aggregation results structure
    result.forEach(group => {
      expect(group._id).toMatch(/^(young|middle|senior)$/);
      expect(typeof group.count).toBe('number');
      expect(typeof group.avgScore).toBe('number');
      expect(typeof group.totalScore).toBe('number');
    });
  });

  it('should use indexes effectively', async () => {
    // Create index
    await User.collection.createIndex({ status: 1, age: 1 });

    const pipeline = [
      { $match: { status: 'active', age: { $gte: 30 } } },
      { $count: 'total' },
    ];

    // Test with explain to verify index usage
    const explainResult = await User.aggregate(pipeline)
      .option({ explain: true });

    // In a real scenario, you'd check the execution stats
    // This is a simplified version
    expect(explainResult).toBeDefined();
  });

  it('should handle large result sets with allowDiskUse', async () => {
    const pipeline = [
      // Complex aggregation that might exceed memory limit
      {
        $group: {
          _id: '$email',
          data: {
            $push: {
              age: '$age',
              status: '$status',
              score: '$score',
              createdAt: '$createdAt',
            },
          },
        },
      },
      { $sort: { '_id': 1 } },
    ];

    const result = await User.aggregate(pipeline)
      .option({ allowDiskUse: true }); // Allow spilling to disk

    expect(result).toBeDefined();
    expect(result.length).toBe(10000); // Should match number of users
  });
});
```

### Query Performance Testing

```typescript
describe('Query Performance', () => {
  it('should optimize find queries with indexes', async () => {
    // Create index for testing
    await User.collection.createIndex({ email: 1 });
    await User.collection.createIndex({ status: 1, age: 1 });

    const startTime = Date.now();
    
    // Test indexed query
    const users = await User.find({ 
      status: 'active',
      age: { $gte: 25, $lte: 45 }
    }).limit(100);

    const executionTime = Date.now() - startTime;

    expect(users.length).toBeLessThanOrEqual(100);
    expect(executionTime).toBeLessThan(100); // Should be very fast with index
  });

  it('should handle pagination efficiently', async () => {
    const pageSize = 50;
    const page = 10;

    const startTime = Date.now();

    const result = await User.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select('email age status createdAt'); // Only select needed fields

    const executionTime = Date.now() - startTime;

    expect(result.length).toBeLessThanOrEqual(pageSize);
    expect(executionTime).toBeLessThan(200); // Should complete quickly
  });

  it('should compare performance of different query approaches', async () => {
    // Approach 1: Multiple individual queries
    const startTime1 = Date.now();
    const activeUsers = await User.find({ status: 'active' });
    const inactiveUsers = await User.find({ status: 'inactive' });
    const time1 = Date.now() - startTime1;

    // Approach 2: Single aggregation query
    const startTime2 = Date.now();
    const groupedUsers = await User.aggregate([
      {
        $group: {
          _id: '$status',
          users: { $push: '$$ROOT' },
          count: { $sum: 1 },
        },
      },
    ]);
    const time2 = Date.now() - startTime2;

    // Aggregation should be more efficient for this type of query
    expect(time2).toBeLessThan(time1);
    
    // Verify results are equivalent
    const activeFromAgg = groupedUsers.find(g => g._id === 'active');
    expect(activeFromAgg?.count).toBe(activeUsers.length);
  });
});
```

## Common Pitfalls and Solutions

### 1. Test Isolation Issues

**Problem**: Tests interfere with each other due to shared database state.

**Solution**:
```typescript
// Always clear database between tests
afterEach(async () => {
  await clearDatabase();
});

// Use transactions for complex test scenarios
it('should handle transaction rollback', async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await User.create([{ email: 'test@test.com' }], { session });
    await session.abortTransaction(); // Rollback for test
  } finally {
    await session.endSession();
  }

  const users = await User.find();
  expect(users.length).toBe(0); // Should be empty after rollback
});
```

### 2. Async/Await Handling

**Problem**: Tests complete before async operations finish.

**Solution**:
```typescript
// ❌ Wrong: Missing await
it('should create user', () => {
  const user = User.create({ email: 'test@test.com' }); // Missing await
  expect(user.email).toBe('test@test.com'); // Will fail
});

// ✅ Correct: Proper async/await
it('should create user', async () => {
  const user = await User.create({ email: 'test@test.com' });
  expect(user.email).toBe('test@test.com');
});
```

### 3. Memory Leaks with MongoDB Memory Server

**Problem**: MongoDB processes not properly closed.

**Solution**:
```typescript
// Proper cleanup in global teardown
let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
});
```

### 4. Race Conditions in Parallel Tests

**Problem**: Multiple tests accessing same collections simultaneously.

**Solution**:
```typescript
// Option 1: Disable parallel execution for database tests
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});

// Option 2: Use unique database names per test
const createTestDatabase = async () => {
  const dbName = `test-${Date.now()}-${Math.random()}`;
  const mongod = await MongoMemoryServer.create({
    instance: { dbName },
  });
  return { mongod, uri: mongod.getUri() };
};
```

### 5. Timeout Issues with Large Operations

**Problem**: Tests timeout during large data operations.

**Solution**:
```typescript
// Increase timeout for specific tests
it('should handle large data import', async () => {
  const largeDataSet = Array.from({ length: 100000 }, (_, i) => ({
    email: `user${i}@test.com`,
    data: 'x'.repeat(1000), // Large field
  }));

  await User.insertMany(largeDataSet);
  const count = await User.countDocuments();
  expect(count).toBe(100000);
}, 30000); // 30 second timeout
```

### 6. Validation Error Testing

**Problem**: Not properly testing Mongoose validation error structure.

**Solution**:
```typescript
// Test validation errors properly
it('should provide detailed validation errors', async () => {
  const user = new User({
    email: 'invalid-email',
    age: -1,
  });

  try {
    await user.validate();
    fail('Should have thrown validation error');
  } catch (error) {
    // Check error structure
    expect(error.name).toBe('ValidationError');
    expect(error.errors.email).toBeDefined();
    expect(error.errors.email.kind).toBe('user defined');
    expect(error.errors.age).toBeDefined();
    expect(error.errors.age.kind).toBe('min');
  }
});
```

## Key Resources

### Official Documentation
- **MongoDB Documentation**: https://www.mongodb.com/docs/manual/
- **Mongoose Documentation**: https://mongoosejs.com/docs/
- **Vitest Documentation**: https://vitest.dev/
- **MongoDB Memory Server**: https://github.com/nodkz/mongodb-memory-server

### Performance and Optimization
- **MongoDB Aggregation Pipeline Optimization**: https://www.mongodb.com/docs/manual/core/aggregation-pipeline-optimization/
- **Practical MongoDB Aggregations**: https://www.practical-mongodb-aggregations.com/guides/performance.html

### Testing Libraries and Tools
- **Supertest**: https://github.com/ladjs/supertest
- **vitest-mms**: https://github.com/danielpza/vitest-mms
- **MongoDB Testing Guide**: https://jestjs.io/docs/mongodb

### Community Resources
- **FreeCodeCamp Testing Guide**: https://www.freecodecamp.org/news/how-to-test-in-express-and-mongoose-apps/
- **CodeUtopia Mongoose Testing**: https://codeutopia.net/blog/2016/06/10/mongoose-models-and-unit-tests-the-definitive-guide/

This guide provides a comprehensive foundation for testing MongoDB and Mongoose applications with modern JavaScript testing frameworks. The patterns and examples shown here are based on current best practices and official documentation as of 2024-2025.