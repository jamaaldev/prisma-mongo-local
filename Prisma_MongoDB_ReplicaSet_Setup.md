# Prisma + MongoDB Replica Set (rs0) Setup Guide

## Why Use a 3-Node Replica Set?

A MongoDB replica set requires **3 nodes minimum** because:

- **High Availability**: Survives single node failure (2/3 nodes maintain majority)
- **Data Redundancy**: Each node has full data copy
- **Fault Tolerance**: Automatic failover to new primary
- **Read Scaling**: Secondaries can handle read operations

> 🚨 For production: Use separate servers. This guide uses one machine for local testing.

---

## Step 1: Set Up MongoDB Replica Set (rs0)

### 1. Create Data Directories
```bash
mkdir C:\data\db1  # Primary (27017)
mkdir C:\data\db2  # Secondary (27018)
mkdir C:\data\db3  # Secondary (27019)
```

### 2. Start 3 MongoDB Instances

Run each in separate Admin terminals:

**Primary (Port 27017)**
```bash
mongod --dbpath "C:\data\db1" --replSet rs0 --port 27017 --bind_ip localhost
```

**Secondary (Port 27018)**
```bash
mongod --dbpath "C:\data\db2" --replSet rs0 --port 27018 --bind_ip localhost
```

**Secondary (Port 27019)**
```bash
mongod --dbpath "C:\data\db3" --replSet rs0 --port 27019 --bind_ip localhost
```

### 3. Initialize Replica Set
```bash
mongosh --port 27017
```

In the shell:
```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})
```

Verify with:
```javascript
rs.status()  // Should show 1 PRIMARY and 2 SECONDARIES
```

---

## Step 2: Configure Prisma with MongoDB

### 1. Install Dependencies
```bash
npm init -y
npm install prisma @prisma/client
npx prisma init
```

### 2. Edit `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["mongoDb"]
}

datasource db {
  provider = "mongodb"
  url      = "mongodb://localhost:27017,localhost:27018,localhost:27019/mydb?replicaSet=rs0"
}

model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  name  String
  email String @unique
}
```

### 3. Push Schema & Generate Client
```bash
npx prisma db push
npx prisma generate
```

---

## Step 3: Test with Prisma Client

Create `index.js`:

```javascript
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create user
  const user = await prisma.user.create({
    data: { name: "Alice", email: "alice@example.com" }
  })
  console.log("Created user:", user)

  // Read users
  const users = await prisma.user.findMany()
  console.log("All users:", users)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run the Script:
```bash
node index.js
```

Expected Output:
```
Created user: { id: '...', name: 'Alice', email: 'alice@example.com' }
All users: [ { id: '...', name: 'Alice', email: 'alice@example.com' } ]
```

---

## 🐞 Troubleshooting

| Error | Solution |
|-------|----------|
| Prisma doesn't support transactions | Ensure `replicaSet=rs0` is in connection URL |
| Cannot connect to MongoDB | Verify all 3 nodes are running (`rs.status()`) |
| Invalid schema: @db.ObjectId required | Always define IDs as: `id String @id @default(auto()) @map("_id") @db.ObjectId` |

---

## 🚀 Next Steps

- Add authentication (`mongodb://user:pass@host:port`)
- Deploy to production (use separate servers)
- Explore Prisma relations with MongoDB

---

### 📄 To use this file:
1. Download and rename it as `README.md`
2. Place in your project root directory

## Step 4: Verify Replica Set Status

In the same MongoDB shell, check the replica set status:

```javascript
rs.status()
```

**Expected Output**:
- One node should be **PRIMARY** (port 27017)
- The other two should be **SECONDARY** (ports 27018 & 27019)

---

## Step 5: Test Replication

Insert data into the **PRIMARY** (27017):

```javascript
use testdb
db.testcoll.insert({ message: "Hello Replica Set!" })
```

### Read from a SECONDARY (27018 or 27019)

> By default, SECONDARIES don’t allow reads unless explicitly set.

Connect to a secondary:

```bash
mongo --port 27018
```

Enable read operations:

```javascript
rs.slaveOk()
```

Query the data:

```javascript
use testdb
db.testcoll.find()
```

✅ You should see the inserted document.

---

## Optional: Automate Startup (Windows Services)

To avoid manually starting MongoDB instances each time, you can register them as Windows services:

### Register MongoDB as a Service (Repeat for each instance)

```bash
mongod --dbpath "C:\data\db1" --replSet rs0 --port 27017 --bind_ip localhost --install --serviceName "MongoDB1"
mongod --dbpath "C:\data\db2" --replSet rs0 --port 27018 --bind_ip localhost --install --serviceName "MongoDB2"
mongod --dbpath "C:\data\db3" --replSet rs0 --port 27019 --bind_ip localhost --install --serviceName "MongoDB3"
```

### Start Services

```bash
net start MongoDB1
net start MongoDB2
net start MongoDB3
```

---

## Troubleshooting

| Error                                       | Solution |
|--------------------------------------------|----------|
| **"replSetInitiate quorum check failed"**  | Ensure all 3 instances are running. Check logs for connectivity. |
| **"Cannot connect to MongoDB"**            | Verify `--bind_ip localhost` is used and ports 27017–27019 are free. |

---

## Conclusion

✅ You now have a **3-node MongoDB replica set (`rs0`)** running!

- **Primary (27017)** – Accepts writes
- **Secondaries (27018, 27019)** – Replicate data

This setup provides **high availability** — if the primary fails, a secondary automatically becomes the new primary.

> Would you like to add authentication (username/password) or configure arbiters for better fault tolerance? 🚀

---

## 🖥️ Optional: Setting Up MongoDB Replica Set on AWS EC2 (For Remote or Production Testing)

### Prerequisites

- An AWS account with at least **3 EC2 instances** (t2.micro or higher) running **Ubuntu 20.04** or similar
- Security group allowing TCP ports **27017, 27018, 27019** between the instances
- SSH access to all instances
- Hostnames or private IPs of each instance

---

### Step 1: Install MongoDB on All EC2 Instances

SSH into each instance and run:

```bash
sudo apt update
sudo apt install -y gnupg curl
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
```

---

### Step 2: Configure mongod on Each Node

Edit the MongoDB config:

```bash
sudo nano /etc/mongod.conf
```

Set these values:

```yaml
replication:
  replSetName: rs0

net:
  bindIp: 0.0.0.0
  port: 27017
```

Start and enable the service:

```bash
sudo systemctl enable mongod
sudo systemctl start mongod
```

---

### Step 3: Initialize the Replica Set

On the node you choose as primary, open the shell:

```bash
mongosh
```

Run:

```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "ec2-xx-xx-xx-xx.compute-1.amazonaws.com:27017" },
    { _id: 1, host: "ec2-yy-yy-yy-yy.compute-1.amazonaws.com:27017" },
    { _id: 2, host: "ec2-zz-zz-zz-zz.compute-1.amazonaws.com:27017" }
  ]
})
```

Use private DNS or IP addresses if in the same VPC.

---

### Step 4: Open Ports in AWS Security Group

Ensure that ports **27017-27019** are open between the 3 nodes:
- Go to EC2 > Security Groups
- Add inbound rules for **custom TCP** on ports 27017–27019 with **source = security group itself**

---

### Step 5: Connect Prisma from Local Machine

In your `schema.prisma` file, set the connection URL to:

```
mongodb://ec2-xx-xx-xx-xx:27017,ec2-yy-yy-yy-yy:27017,ec2-zz-zz-zz-zz:27017/mydb?replicaSet=rs0
```

> 📌 Make sure your EC2 IPs/DNS are accessible from your local environment or tunneling/VPN is used.

---

✅ Now you have a cloud-based MongoDB replica set ready to use with Prisma!
