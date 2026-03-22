# Role-Based Access Control (RBAC) Status & Fixes Needed

## Current Status

### ✅ What's Working:
1. **Navigation Menu Filtering** - The Navigation component correctly filters menu items based on user roles
2. **Route Protection** - The `RequireAccess` component protects routes based on `allowedRoles`
3. **RBAC Configuration** - Comprehensive role definitions in `/lib/rbac.ts`

### ❌ What's NOT Working:

#### 1. Virtual Hearing Page Location
- **Location**: `/virtual-hearing` (http://localhost:3000/virtual-hearing)
- **Problem**: Currently allows ALL roles to access it
- **Code**: `<RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK', 'LAWYER', 'PLAINTIFF', 'DEFENDANT', 'USER']}>`

#### 2. Same Content for All Roles
- **Problem**: Pages show identical content regardless of user role
- **Example**: Dashboard shows the same stats and activities for judges, lawyers, and clerks
- **Root Cause**: No role-based content filtering within page components

## Role Definitions (from rbac.ts)

### SYSTEM_ADMIN
- Full access to all features
- Can access: Dashboard, Cases, Hearings, Documents, Virtual Hearing, Users, Reports, Messages, Archives, Schedule, Settings, Logs, Security, Notifications, Profile

### COURT_ADMIN
- Administrative access (no security/logs)
- Can access: Dashboard, Cases, Hearings, Documents, Virtual Hearing, Users, Reports, Messages, Archives, Schedule, Settings, Notifications, Profile

### JUDGE
- Judicial functions
- Can access: Dashboard, Cases, Hearings, Documents, Virtual Hearing, Reports, Messages, Archives, Schedule, Settings, Notifications, Profile

### CLERK
- Court operations
- Can access: Dashboard, Cases, Hearings, Documents, Virtual Hearing, Reports, Messages, Archives, Settings, Notifications, Profile

### LAWYER
- Legal representation
- Can access: Dashboard, Cases, Hearings, Documents, Virtual Hearing, Messages, Notifications, Profile

### PLAINTIFF / DEFENDANT
- Party access
- Can access: Dashboard, Cases, Hearings, Documents, Virtual Hearing, Messages, Notifications, Profile

### USER
- Basic access
- Can access: Dashboard, Messages, Notifications, Profile

## Fixes Needed

### 1. Restrict Virtual Hearing Access
**Current**: Everyone can access
**Should be**: Only users with hearing participation rights

```typescript
// Change from:
<RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK', 'LAWYER', 'PLAINTIFF', 'DEFENDANT', 'USER']}>

// To:
<RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK', 'LAWYER', 'PLAINTIFF', 'DEFENDANT']}>
```

### 2. Add Role-Based Content Filtering

#### Dashboard (page.tsx)
- **JUDGE**: Show assigned cases, upcoming hearings, pending judgments
- **LAWYER**: Show client cases, hearing schedule, document deadlines
- **CLERK**: Show case assignments, document processing queue
- **PLAINTIFF/DEFENDANT**: Show their cases only, hearing dates

#### Virtual Hearing (virtual-hearing/page.tsx)
- **JUDGE**: Full controls (recording, mute participants, breakout rooms)
- **LAWYER**: Participant controls (mute self, raise hand, share screen)
- **PLAINTIFF/DEFENDANT**: Basic participant (mute self, raise hand)

#### Cases (cases/page.tsx)
- **JUDGE**: All assigned cases
- **LAWYER**: Client cases only
- **CLERK**: Cases for processing
- **PLAINTIFF/DEFENDANT**: Their cases only

### 3. Implement Role-Based UI Components

Create a `RoleBasedContent` component:

```typescript
// components/RoleBasedContent.tsx
export function RoleBasedContent({ 
  allowedRoles, 
  children 
}: { 
  allowedRoles: Role[]; 
  children: React.ReactNode 
}) {
  const userRole = useUserRole();
  if (!allowedRoles.includes(userRole)) return null;
  return <>{children}</>;
}
```

Usage example:
```typescript
<RoleBasedContent allowedRoles={['JUDGE', 'CLERK']}>
  <button onClick={startRecording}>Start Recording</button>
</RoleBasedContent>
```

### 4. Add Role-Based Data Filtering

Create API middleware to filter data based on user role:

```typescript
// lib/dataFilters.ts
export function filterCasesByRole(cases: Case[], user: User): Case[] {
  const role = normalizeRoleFromUser(user);
  
  switch (role) {
    case 'JUDGE':
      return cases.filter(c => c.assignedJudge === user.id);
    case 'LAWYER':
      return cases.filter(c => c.lawyerId === user.id);
    case 'PLAINTIFF':
      return cases.filter(c => c.plaintiffId === user.id);
    case 'DEFENDANT':
      return cases.filter(c => c.defendantId === user.id);
    default:
      return [];
  }
}
```

## Test Credentials

- **Judge**: `judge.alemu` / `Judge123!`
- **Lawyer**: `lawyer.sara` / `Lawyer123!`
- **Admin**: `admin.system` / `Admin123!`
- **Clerk**: `clerk.mohammed` / `Clerk123!`
- **Plaintiff**: `plaintiff.john` / `User123!`

## Next Steps

1. ✅ Fix rate limiting (DONE)
2. ⏳ Restrict virtual hearing access to appropriate roles
3. ⏳ Implement role-based content filtering in Dashboard
4. ⏳ Add role-based controls in Virtual Hearing page
5. ⏳ Create RoleBasedContent component
6. ⏳ Implement data filtering by role
7. ⏳ Test each role's access and functionality
