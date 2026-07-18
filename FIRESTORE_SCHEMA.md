# Firestore Database Schema & Backend Architecture Design
## Aetheria House Rentals & Real-Time Messaging Engine

This document outlines the complete NoSQL Firestore database schema, composite indexing strategies, and backend system architecture designed to power the **Aetheria Rentals** platform. It satisfies both multi-attribute custom property filtering and radius-based geographic queries.

---

## 1. Core Architecture Overview

```
                        +----------------------------+
                        |     React Frontend SPA     |
                        | (Tailwind CSS, SVG Canvas) |
                        +--------------+-------------+
                                       |
                     HTTPS Rest / API  |   Real-Time listeners (onSnapshot)
                     & OAuth Requests  |   & Database Queries
                                       v
                        +--------------+-------------+
                        |  Full-Stack Express API    |
                        |      (Server-Side API)     |
                        +--------------+-------------+
                                       |
                    Firebase SDK / IAM |  Gemini 3.5 Flash Model
                    & Security Rules   |  (Landlord Character Simulation)
                                       v
         +-------------------------------------------------------+
         |                       GCP / Firebase                  |
         |  +-------------------+  +--------------------------+  |
         |  |   Firebase Auth   |  |   Cloud Firestore DB     |  |
         |  |  (Tenant/Landlord)|  |  (Collections/Indexes)   |  |
         |  +-------------------+  +--------------------------+  |
         +-------------------------------------------------------+
```

Firestore is a scalable, real-time NoSQL document database. Our architecture optimizes queries for:
1. **Dynamic Attribute Filtering**: Combining multi-field searches (e.g., structure type, bed/bath counters, price boundaries, amenities) on a single collection.
2. **Radius-Based Geographic Search**: Executing geographical range queries using **Geohashes** to locate properties within a specified radius (e.g., 5 miles) of any latitude/longitude anchor.
3. **Real-Time Client Messaging**: Leveraging persistent WebSockets via Firestore's native `onSnapshot()` streams for zero-latency communication between prospective tenants and landlords, augmented by a server-side Gemini agent.

---

## 2. Collection Schemas

### 2.1. `users` Collection
*Document Path:* `/users/{userId}`
Tracks authentication profiles, contact info, and custom interaction preferences.

```json
{
  "uid": "usr_91283aBc",
  "email": "tenant.sajjad@example.com",
  "displayName": "Sajjad Godrej",
  "avatarUrl": "https://images.aetheria.example/avatars/usr_91283.png",
  "role": "tenant", // ["tenant", "landlord", "admin"]
  "createdAt": "2026-07-15T18:22:15Z",
  "savedListings": [
    "prop_pacific_01",
    "prop_summit_04"
  ],
  "deviceTokens": [
    "fcm_token_xyz_123..." // Used for push notifications on new messages
  ],
  "metadata": {
    "lastLogin": "2026-07-15T18:22:15Z",
    "platform": "web"
  }
}
```

### 2.2. `properties` Collection
*Document Path:* `/properties/{propertyId}`
Maintains the detailed listing records, structural attributes, and geographical location parameters. 

> **How Geohashing Works for Radius Queries:** 
> Since Firestore queries only support single-range inequalities (e.g., `price <= 5000`), a 2D radius search (latitude and longitude) requires a 1D geohash representation. A geohash divides the map into a grid of string hashes.
> - `geohash`: A string (e.g., `9q8yyw`) indicating a specific bounding box.
> - `geopoint`: Native Firestore latitude & longitude container for precise coordinate calculation on the client side.

```json
{
  "id": "prop_pacific_01",
  "title": "Pacific Vista Villa",
  "description": "An architectural masterpiece offering sweeping ocean views, an infinity pool, and pristine minimalist design.",
  "type": "House", // ["House", "Apartment", "Condo", "Cabin", "Loft"]
  "price": 4500, // Monthly lease price
  "beds": 4,
  "baths": 3,
  "sqft": 2800,
  "rating": 4.9,
  "reviewsCount": 32,
  "imageColor": "from-blue-600 via-indigo-700 to-sky-800", // Visual layout theme representation
  "isAvailable": true,
  "createdAt": "2026-06-01T10:00:00Z",
  
  // Geolocation Fields
  "geopoint": {
    "_latitude": 34.0194,
    "_longitude": -118.4912
  },
  "geohash": "9q5y3e4r", // Computed geohash (usually 8-10 characters)
  
  // Custom Property Attributes
  "amenities": {
    "pool": true,
    "wiFi": true,
    "ac": true,
    "parking": true,
    "gym": false,
    "washerDryer": true,
    "petsFriendly": true
  },
  
  // Landlord Reference Block
  "host": {
    "uid": "usr_landlord_99",
    "name": "Sarah Connor",
    "avatar": "SC",
    "responseRate": "100%",
    "responseTime": "Within 5 mins"
  }
}
```

### 2.3. `chats` Collection
*Document Path:* `/chats/{chatId}`
A chat represents a persistent messaging thread linked to a specific listing. Messages themselves reside in a subcollection to allow pagination and efficient loading.

```json
{
  "id": "chat_usr83_prop01",
  "propertyId": "prop_pacific_01",
  "propertyTitle": "Pacific Vista Villa",
  "tenantId": "usr_91283aBc",
  "tenantName": "Sajjad Godrej",
  "landlordId": "usr_landlord_99",
  "landlordName": "Sarah Connor",
  "lastMessageText": "Is parking included with the lease?",
  "lastMessageTimestamp": "2026-07-15T18:25:00Z",
  "unreadByTenant": false,
  "unreadByLandlord": true
}
```

#### Message Subcollection
*Document Path:* `/chats/{chatId}/messages/{messageId}`
Individual chronological text messages inside the chat.

```json
{
  "id": "msg_0019283",
  "senderId": "usr_91283aBc", // Matches tenantId (user) or landlordId (host)
  "senderRole": "tenant", // ["tenant", "landlord"]
  "text": "Is parking included with the lease?",
  "timestamp": "2026-07-15T18:25:00Z",
  "isRead": false
}
```

---

## 3. Query & Indexing Strategy

Firestore requires single and composite indexes to perform advanced filters quickly.

### 3.1. Necessary Composite Indexes

For multi-attribute filtering (such as choosing *House type* AND *price range* AND *number of bedrooms*), composite indexes must be declared in Firestore. Below is the list of composite indexes required for Aetheria:

| Collection ID | Fields to Index (in order) | Query Type |
| :--- | :--- | :--- |
| `properties` | `type` (Ascending) + `price` (Ascending) | Filtering property type & sorting price |
| `properties` | `isAvailable` (Ascending) + `geohash` (Ascending) + `price` (Ascending) | Map radius matching along with price sorting |
| `properties` | `type` (Ascending) + `beds` (Ascending) + `price` (Ascending) | Filter by type & beds, sorted by lowest price |
| `properties` | `isAvailable` (Ascending) + `amenities.pool` (Ascending) + `price` (Ascending) | Filter by specific amenities & price range |
| `chats` | `tenantId` (Ascending) + `lastMessageTimestamp` (Descending) | Fetching user chat list sorted by recency |

---

## 4. Radius-Based Location Queries (Geohashing Pattern)

### 4.1. The Algorithm
To search for listings within a `5-mile` radius of a coordinate:
1. The client-side calculates the center coordinate (latitude, longitude) of the clicked pin.
2. Utilizing a library like `geofire-common` or similar, we calculate the geohash ranges that encompass a bounding box representing a 5-mile circle around the center point.
3. This outputs a set of coordinate limits, mapped to geohash prefixes (e.g., geohashes starting with `9q5y3e`).
4. We query Firestore for properties where `geohash >= rangeStart` AND `geohash <= rangeEnd`.
5. Since a bounding box returns a square, the client performs a final Euclidean distance filter to prune properties in the outer corners of the box, showing a perfect radial search halo.

```typescript
import * as geofire from 'geofire-common';
import { query, collection, where, orderBy, getDocs } from 'firebase/firestore';

// Search coordinates for selected pin
const center = [34.0194, -118.4912]; // [lat, lng]
const radiusInM = 5 * 1609.34; // 5 miles in meters

// Get the geohash bounds for query range
const bounds = geofire.geohashQueryBounds(center, radiusInM);
const promises = [];

for (const b of bounds) {
  const q = query(
    collection(db, 'properties'),
    where('isAvailable', '==', true),
    orderBy('geohash'),
    startAt(b[0]),
    endAt(b[1])
  );
  promises.push(getDocs(q));
}

// Merge matching snapshots and filter precise radial distance
const snapshots = await Promise.all(promises);
const matchingProperties = [];

snapshots.forEach((snap) => {
  snap.docs.forEach((doc) => {
    const data = doc.data();
    const lat = data.geopoint.latitude;
    const lng = data.geopoint.longitude;

    // Filter precise circle radius from bounds box
    const distanceInKm = geofire.distanceBetween([lat, lng], center);
    const distanceInM = distanceInKm * 1000;
    if (distanceInM <= radiusInM) {
      matchingProperties.push({ id: doc.id, ...data, distance: distanceInM });
    }
  });
});
```

---

## 5. Firebase Security Rules (`firestore.rules`)

These rules secure database collections, preventing unauthorized access, ensuring tenants can only read/write their own chat threads, and protecting landlord data from malicious writes.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Is the user logged in?
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper: Does the user ID match the record?
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // --- Users Collection ---
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isOwner(userId);
    }

    // --- Properties Collection ---
    match /properties/{propertyId} {
      // Anyone can search active properties
      allow read: if true;
      // Only authorized landlords can create/edit listings
      allow write: if isSignedIn() && (
        request.resource.data.host.uid == request.auth.uid || 
        resource.data.host.uid == request.auth.uid
      );
    }

    // --- Chats Collection ---
    match /chats/{chatId} {
      // Only the tenant or landlord involved in the thread can access
      allow read: if isSignedIn() && (
        resource.data.tenantId == request.auth.uid || 
        resource.data.landlordId == request.auth.uid
      );
      
      // Starting a new chat is permitted if user is authenticated
      allow create: if isSignedIn() && request.resource.data.tenantId == request.auth.uid;
      
      // Updates are restricted to thread participants
      allow update: if isSignedIn() && (
        resource.data.tenantId == request.auth.uid || 
        resource.data.landlordId == request.auth.uid
      );

      // --- Nested Message Subcollection ---
      match /messages/{messageId} {
        allow read, write: if isSignedIn() && (
          get(/databases/$(database)/documents/chats/$(chatId)).data.tenantId == request.auth.uid ||
          get(/databases/$(database)/documents/chats/$(chatId)).data.landlordId == request.auth.uid
        );
      }
    }
  }
}
```

---

## 6. End-to-End User Flow Architecture

```
[1. LANDING & DISCOVERY]
       |  Tenant lands on Aetheria Rentals. Loads properties list.
       v
[2. MAP NAVIGATION]
       |  Tenant pans around standard visual grid and hovers on markers.
       v
[3. GEOGRAPHIC SEARCH]
       |  Tenant clicks center coordinate on map, sets radius slider.
       |  Vite Express Server calculates geohash bounding box query limits.
       |  Lists updated with properties filtered within distance limit.
       v
[4. CUSTOM ATTRIBUTES]
       |  Tenant filters by "Apartment" structure, "$4000 price ceiling", "Pool" amenity.
       |  Combined search instantly highlights custom matched pin configurations on map.
       v
[5. INQUIRY & CHATING]
       |  Tenant clicks "Inquire" on Pacific Vista. Messaging sliding panel opens.
       |  WebSockets initialize onSnapshot listener. Chat history renders.
       v
[6. CONVERSATION LOOP]
       |  Tenant sends message -> "Is parking safe?"
       |  Vite backend calls Gemini 3.5 Flash server-side.
       |  Gemini reads property metadata & host personality.
       |  Generates immediate context-grounded response as host.
       |  Chat screen updates live with typing-simulation indicators.
```
