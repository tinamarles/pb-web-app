````mermaid
sequenceDiagram
    participant B as Browser
    participant M as Next.js Middleware
    participant L as app/login/page.tsx (Client)
    participant A as api/auth/login/route.ts (Server)
    participant D as Django API
    participant UP as api/auth/user/route.ts (Server)
    participant P as Protected Page

    %% Initial Request (Unauthenticated)
    B->>M: Request Protected Page (e.g., /dashboard)
    activate M
    M->>M: Check for access_token cookie
    M-->>B: Redirect to /login
    deactivate M
    B->>L: Request /login page
    activate L
    L->>+UP: Initial fetch('/api/auth/user')
    activate UP
    UP->>UP: Check for access_token cookie
    UP-->>-L: 401 Unauthorized Response
    L->>L: Update user state to null

    %% Login Process
    L->>A: Form Submission<br>POST /api/auth/login
    activate A
    A->>D: POST /api/token/<br>with credentials
    activate D
    D-->>A: Return access & refresh tokens
    deactivate D
    A->>A: Set HttpOnly cookies<br>on response headers
    A-->>L: 200 OK Response<br>(success: true)
    deactivate A
    L->>L: router.refresh()

    %% Post-Login Refresh & Redirect
    L->>M: Re-request /login<br>with new cookies
    activate M
    M->>M: Check for access_token cookie<br>(found!)
    M->>M: Verify token & get user_role
    M->>M: Check if on public page
    M-->>B: Redirect to /dashboard/member
    deactivate M
    B->>P: Request /dashboard/member

    %% Authenticated Page Load
    activate P
    P->>P: Render Server Components
    P->>+UP: fetch('/api/auth/user')<br>from AuthUserProvider
    activate UP
    UP->>UP: Read access_token from cookies
    UP->>D: GET /api/auth/user/<br>with Authorization: Bearer
    activate D
    D-->>UP: Return user data
    deactivate D
    UP-->>-P: 200 OK Response<br>with user data
    P->>P: Update AuthUserContext<br>with user data
    deactivate P
    ```
````
