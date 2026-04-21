# Profiles API

Backend Wizards Stage 2 — Express + TypeScript + PostgreSQL + Intelligence Query Engine

## Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Database**: PostgreSQL via Prisma ORM
- **ID generation**: UUID v7

## Features
- **Advanced Filtering**: Filter by gender, age groups, country, age range, and probability thresholds
- **Sorting**: Sort by age, creation date, or gender probability
- **Pagination**: Configurable page size (1-50 items per page)
- **Natural Language Search**: Query profiles in plain English (e.g., "young males from nigeria")
- **Database Seeding**: Seed 2026 profiles from JSON without creating duplicates

## Local Setup & Running

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **PostgreSQL** v12 or higher ([Download](https://www.postgresql.org/download/) or use Docker)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/hng14-stage2-intelligence-query-engine.git
cd hng14-stage2-intelligence-query-engine
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then open `.env` and configure the following:

```env
# Database connection string
# Format: postgresql://user:password@localhost:5432/database_name
DATABASE_URL=postgresql://postgres:password@localhost:5432/profiles_db

# Server port (optional, defaults to 3000)
PORT=3000
```

### Step 4: Set Up the Database

Generate the Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

This will:
- Generate the Prisma client
- Create the database schema
- Set up the profiles table with UUID v7 primary keys

### Step 5: Seed the Database

Load the 2026 profiles from `seed_profiles.json`:

```bash
npm run seed
```

This script:
- Reads all profiles from `seed_profiles.json`
- Skips any profiles that already exist (idempotent)
- Creates new profiles with UUID v7 IDs
- Can be run multiple times safely without creating duplicates

### Step 6: Run the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000` and watch for file changes.

You should see output like:
```
Server listening on port 3000
```

### Verify It's Working

Test the API with curl requests:

```bash
# Get all profiles (with default pagination)
curl http://localhost:3000/api/profiles

# Get profiles from Nigeria, sorted by age
curl "http://localhost:3000/api/profiles?country_id=NG&sort_by=age&order=desc"

# Search with natural language
curl "http://localhost:3000/api/profiles/search?q=young%20males%20from%20nigeria"
```

### Additional Development Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build the TypeScript project for production |
| `npm start` | Run the compiled production build |
| `npm run prisma:studio` | Open Prisma Studio to view/manage database data |
| `npm run lint` | Run ESLint to check code quality |
| `npm run seed` | Seed the database with 2026 profiles |

---

## API Endpoints

### 1. Get All Profiles with Filtering & Pagination

**Endpoint**: `GET /api/profiles`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `gender` | string | Filter by gender: "male" or "female" |
| `age_group` | string | Filter by age group: "child", "teenager", "adult", "senior" |
| `country_id` | string | Filter by ISO country code (e.g., "NG", "KE") |
| `min_age` | number | Minimum age (inclusive) |
| `max_age` | number | Maximum age (inclusive) |
| `min_gender_probability` | number | Minimum gender confidence score (0-1) |
| `min_country_probability` | number | Minimum country confidence score (0-1) |
| `sort_by` | string | Sort field: "age", "created_at", or "gender_probability" |
| `order` | string | Sort order: "asc" or "desc" (default: "asc") |
| `page` | number | Page number (default: 1, must be ≥ 1) |
| `limit` | number | Items per page (default: 10, max: 50) |

**Example Request**:
```bash
curl "http://localhost:3000/api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10"
```

**Success Response (200)**:
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 2026,
  "data": [
    {
      "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
      "name": "Emmanuel",
      "gender": "male",
      "gender_probability": 0.99,
      "age": 34,
      "age_group": "adult",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.85,
      "created_at": "2026-04-01T12:00:00Z"
    }
  ]
}
```

**Notes**:
- All filters are combinable and work with AND logic (results match all conditions)
- Pagination defaults: page=1, limit=10
- Maximum limit is 50 items per page
- Timestamps are in UTC ISO 8601 format

---

### 2. Natural Language Search

**Endpoint**: `GET /api/profiles/search`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Plain English query (required) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 50) |

**Example Requests**:
```bash
# Young males from Nigeria
curl "http://localhost:3000/api/profiles/search?q=young%20males%20from%20nigeria"

# Females above 30
curl "http://localhost:3000/api/profiles/search?q=females%20above%2030"

# Adult males from Kenya
curl "http://localhost:3000/api/profiles/search?q=adult%20males%20from%20kenya"

# Teenagers above 17
curl "http://localhost:3000/api/profiles/search?q=teenagers%20above%2017"
```

**Success Response (200)**:
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 150,
  "data": [
    {
      "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
      "name": "Emmanuel",
      "gender": "male",
      "gender_probability": 0.99,
      "age": 21,
      "age_group": "teenager",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.85,
      "created_at": "2026-04-01T12:00:00Z"
    }
  ]
}
```

**Unable to Interpret Response (200)**:
```json
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

---

## Natural Language Parsing Logic

The search endpoint uses **rule-based parsing** (no AI/LLMs) to interpret plain English queries.

### Supported Keywords & Mappings

#### Gender Keywords
- **"male"** → `gender=male`
- **"female"** → `gender=female`

#### Age Group Keywords
- **"child"** or **"children"** → `age_group=child`
- **"teenager"** or **"teens"** → `age_group=teenager`
- **"adult"** → `age_group=adult`
- **"senior"** → `age_group=senior`

#### Age Range Keywords
- **"young"** → `min_age=16, max_age=24` (interpreted as "young" for parsing purposes only)
- **"above X"** or **"over X"** → `min_age=X` (e.g., "above 30" → min_age=30)
- **"below X"** or **"under X"** → `max_age=X` (e.g., "below 25" → max_age=25)

#### Country Keywords
Supports country names and demonyms (e.g., "Nigeria"/"Nigerian", "Kenya"/"Kenyan"):
- **Nigeria** → NG
- **Kenya** → KE
- **Ghana** → GH
- **Uganda** → UG
- **Tanzania** → TZ
- **Benin** → BJ
- **Sudan** → SD
- **Egypt** → EG
- **South Africa** → ZA
- **Ethiopia** → ET
- **Cameroon** → CM
- **Mozambique** → MZ
- **Malawi** → MW
- **Zimbabwe** → ZW
- **Botswana** → BW
- **Namibia** → NA
- **Lesotho** → LS
- **Eswatini** → SZ
- **Mauritius** → MU
- **Angola** → AO
- **United States** → US
- **United Kingdom** → GB
- **Canada** → CA
- **Australia** → AU
- And more...

### Example Query Interpretations

| Query | Parsed Filters |
|-------|----------------|
| `young males` | gender=male + min_age=16 + max_age=24 |
| `females above 30` | gender=female + min_age=30 |
| `people from nigeria` | country_id=NG |
| `adult males from kenya` | gender=male + age_group=adult + country_id=KE |
| `male and female teenagers above 17` | age_group=teenager + min_age=17 |
| `young females from south africa` | gender=female + min_age=16 + max_age=24 + country_id=ZA |

### Parsing Logic
1. **Case-insensitive matching** - All keywords are matched regardless of case
2. **Sequential keyword extraction** - Keywords are extracted in order
3. **AND logic** - All extracted filters are combined (results must match all conditions)
4. **First match wins for country** - If multiple countries are mentioned, the first one is used

---

## Limitations & Edge Cases

### What the Parser Doesn't Handle

1. **Complex Boolean Logic**: 
   - The parser only supports AND logic
   - "Males or females" is not supported (only AND)
   - Negation like "not males" is not supported

2. **Age Ambiguity**:
   - "Young" is hardcoded to 16-24 (not dynamically determined)
   - Relative terms like "older than" or "younger than" are not supported
   - Only "above/over" and "below/under" are recognized

3. **Multiple Countries**:
   - Only the first country mentioned is used
   - "People from Nigeria and Kenya" would only match Nigeria

4. **Probability Filtering**:
   - Natural language queries don't support probability thresholds
   - Use the `/api/profiles` endpoint directly for probability filtering

5. **Whitespace & Punctuation**:
   - Queries are trimmed but punctuation is ignored
   - "males?" and "males!" are treated the same as "males"

6. **Typos & Misspellings**:
   - Exact keyword matching only
   - "nigera" won't match "nigeria"
   - "kkk" won't match "kenya"

7. **Ambiguous Queries**:
   - "Adult children" conflicts (adult + child age groups)
   - "Senior teenagers" conflicts (senior + teenager age groups)
   - In such cases, the last mentioned age group wins

8. **Context-Dependent Meaning**:
   - "Young adults" would match age_group=adult + min_age=16 + max_age=24 (conflicting)
   - Use the `/api/profiles` endpoint for complex scenarios

### Recommended Fallback Strategy

When the search endpoint returns "Unable to interpret query":
1. Use the standard `/api/profiles` endpoint with explicit query parameters
2. Build multi-step queries instead of complex single queries
3. Test queries with different phrasings

---

## Error Handling

All error responses follow this structure:

```json
{
  "status": "error",
  "message": "<error message>"
}
```

### HTTP Status Codes

| Status | Scenario | Example |
|--------|----------|---------|
| **400** | Missing or empty required parameter | Missing `q` in search endpoint |
| **404** | Resource not found | Profile ID doesn't exist |
| **422** | Invalid parameter type or value | `limit=abc` or `page=-1` |
| **500/502** | Server error | Database connection failure |

### Example Error Responses

**Missing Query Parameter (400)**:
```json
{
  "status": "error",
  "message": "Query parameter q is required"
}
```

**Invalid Pagination (422)**:
```json
{
  "status": "error",
  "message": "Invalid query parameters"
}
```

**Unable to Parse Query (200)**:
```json
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

---

## Database Schema

The `profiles` table structure:

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | Primary Key, Default: uuid_v7() | Globally unique identifier |
| `name` | VARCHAR | UNIQUE, NOT NULL | Person's full name |
| `gender` | VARCHAR | NOT NULL | "male" or "female" |
| `gender_probability` | FLOAT | NOT NULL | Confidence score (0-1) |
| `age` | INT | NOT NULL | Exact age in years |
| `age_group` | VARCHAR | NOT NULL | "child", "teenager", "adult", or "senior" |
| `country_id` | VARCHAR(2) | NOT NULL | ISO 3166-1 alpha-2 country code |
| `country_name` | VARCHAR | NOT NULL | Full country name |
| `country_probability` | FLOAT | NOT NULL | Confidence score (0-1) |
| `created_at` | TIMESTAMP | NOT NULL, Default: now() | UTC ISO 8601 timestamp |

---

## Performance Considerations

- **Indexed Fields**: `country_id`, `age_group`, `gender` are commonly used filters
- **Pagination**: Always use pagination to avoid full table scans
- **Max Limit**: Maximum 50 items per page to prevent memory issues
- **Query Optimization**: Combined filters reduce result set size before sorting

---

## Troubleshooting

**Error: `connect ECONNREFUSED 127.0.0.1:5432`**
- PostgreSQL is not running. Start your database connection
- Check `DATABASE_URL` in `.env` file
- Ensure PostgreSQL is listening on the correct port

**Error: "Unable to interpret query"**
- The search endpoint couldn't parse your query
- Try the `/api/profiles` endpoint with explicit parameters
- Check supported keywords in the Natural Language Parsing section

**Seed Script Errors**
- Ensure database is set up: `npm run prisma:migrate`
- Check `seed_profiles.json` exists in the root directory
- Run `npm run seed` from the project root directory

**UUID Parsing Errors**
- Ensure you're using valid UUID v7 format for the `id` parameter
- IDs are automatically generated; don't manually create them

---

## Development & Testing

### Testing Individual Endpoints

```bash
# Test basic filtering
curl "http://localhost:3000/api/profiles?gender=male&page=1&limit=5"

# Test sorting
curl "http://localhost:3000/api/profiles?sort_by=age&order=asc&limit=10"

# Test natural language
curl "http://localhost:3000/api/profiles/search?q=young%20adults%20from%20nigeria"

# Test error handling
curl "http://localhost:3000/api/profiles?limit=999"
```

### Database Management

```bash
# View all data
npm run prisma:studio

# Create new migration after schema change
npm run prisma:migrate

# Reset database (development only)
npx prisma migrate reset
```

---

## Submission Checklist

- [ ] Server is live and accessible from multiple networks
- [ ] All 2026 profiles are seeded in the database
- [ ] GET /api/profiles supports filtering, sorting, pagination
- [ ] GET /api/profiles/search parses natural language queries
- [ ] CORS header `Access-Control-Allow-Origin: *` is set
- [ ] All timestamps are in UTC ISO 8601 format
- [ ] All IDs are in UUID v7 format
- [ ] README explains natural language parsing logic
- [ ] README documents limitations and edge cases
- [ ] All endpoints tested and working

---

## License

ISC
- PostgreSQL is not running. Start the PostgreSQL service and ensure it's listening on port 5432.

**Error: `database "profiles_db" does not exist`**
- Create the database: `psql -U postgres -c "CREATE DATABASE profiles_db;"`

**Error: `prisma generate` fails**
- Ensure your `.env` file has a valid `DATABASE_URL`
- Try deleting `node_modules` and running `npm install` again

**Port 3000 already in use**
- Change the `PORT` in your `.env` file to another port (e.g., `3001`)
- Or kill the process using port 3000

**Schema changes not reflecting**
- Run `npm run prisma:migrate` to apply new migrations
- Run `npm run prisma:studio` to view and verify database state


## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/profiles` | Create a profile by name |
| GET | `/api/profiles` | Get all profiles (filterable) |
| GET | `/api/profiles/:id` | Get a single profile |
| DELETE | `/api/profiles/:id` | Delete a profile |

---

### 1. Create a Profile
**POST** `/api/profiles`

Creates a new profile based on a name. The server queries external APIs to fetch demographic data (gender, age, country).

**Request:**
```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
```

**Success Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "01890a2b-3c4d-5e6f-7890-abcdef123456",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.98,
    "sample_size": 1250,
    "age": 35,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.85
  }
}
```

**If Profile Already Exists (200 OK):**
```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { ... }
}
```

---

### 2. Get All Profiles
**GET** `/api/profiles`

Retrieve all profiles with optional filtering.

**Request (without filters):**
```bash
curl http://localhost:3000/api/profiles
```

**Request (with filters):**
```bash
# Filter by gender
curl http://localhost:3000/api/profiles?gender=male

# Filter by country
curl http://localhost:3000/api/profiles?country_id=NG

# Filter by age group
curl http://localhost:3000/api/profiles?age_group=adult

# Combine multiple filters
curl http://localhost:3000/api/profiles?gender=female&country_id=GB&age_group=adult
```

**Available Filters:**
- `gender` — `male` or `female` (case-insensitive)
- `country_id` — ISO country code, e.g. `NG`, `US`, `GB` (case-insensitive)
- `age_group` — `child`, `adult`, `senior` (case-insensitive)

**Response (200 OK):**
```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": "01890a2b-3c4d-5e6f-7890-abcdef123456",
      "name": "john",
      "gender": "male",
      "country_id": "US"
    },
    {
      "id": "01890a2c-3c4d-5e6f-7890-abcdef123457",
      "name": "jane",
      "gender": "female",
      "country_id": "NG"
    }
  ]
}
```

---

### 3. Get a Single Profile
**GET** `/api/profiles/:id`

Retrieve detailed information about a specific profile.

**Request:**
```bash
curl http://localhost:3000/api/profiles/01890a2b-3c4d-5e6f-7890-abcdef123456
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "01890a2b-3c4d-5e6f-7890-abcdef123456",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.98,
    "sample_size": 1250,
    "age": 35,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.85
  }
}
```

**Profile Not Found (404 Not Found):**
```json
{
  "status": "error",
  "message": "Profile not found"
}
```

---

### 4. Delete a Profile
**DELETE** `/api/profiles/:id`

Delete a profile by ID.

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/profiles/01890a2b-3c4d-5e6f-7890-abcdef123456
```

**Response (204 No Content):**
- Empty body on success

**Profile Not Found (404 Not Found):**
```json
{
  "status": "error",
  "message": "Profile not found"
}
```

---

## Error Responses

All error responses follow this format:
```json
{ "status": "error", "message": "..." }
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Missing or empty name |
| 404 | Profile not found |
| 422 | Name must be a string |
| 502 | External API returned invalid/null data |
| 500 | Internal server error |
