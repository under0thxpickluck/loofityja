# Lootify Implementation Specification (GAS + Overseas-Style UX)

## 0. Document Purpose

This document is a production-oriented implementation specification for **Lootify**, designed to be handed directly to Claude Code for execution. The target architecture is:

* **Frontend:** Next.js
* **Backend:** Google Apps Script (GAS) Web App
* **Database:** Google Sheets
* **Email Verification:** GAS mail sending
* **Checkout Flow:** Payment-ready structure, but payment gateway remains disabled for now

The scope of this document covers the following core systems:

1. **Account creation with personal information input**
2. **Email verification workflow**
3. **Login, session handling, and logged-in UI behavior**
4. **Product detail page, checkout flow, and payment-ready button structure**
5. **A trustworthy overseas-style user experience and interface language**

This specification must be treated as an **implementation-grade blueprint**, not a rough draft. The build should prioritize scalability, maintainability, and future migration to live payment providers.

---

## 1. Core Product Direction

Lootify should visually and structurally feel like an **international marketplace platform**, not a domestic hobby site.

### 1-1. UX Tone

The product should communicate:

* Trust
* Simplicity
* Security
* Marketplace readiness
* Fast onboarding

### 1-2. UX Language Style

All user-facing copy should be written in concise international e-commerce English.

Use phrases such as:

* `Secure Sign Up`
* `Trusted Marketplace`
* `Fast Checkout`
* `Verified Account`
* `Protected Transactions`
* `Continue to Payment`
* `Manage Your Account`

Avoid wording that feels overly literal, awkward, or machine-translated.

---

## 2. Non-Negotiable Development Rules

Claude Code must follow these rules:

* Do not break or remove the existing site structure
* Do not perform large destructive refactors
* Add functionality in a modular way
* Keep all new logic isolated and reusable
* Use implementation-ready naming for API actions and UI components
* Return consistent JSON structures from GAS
* Keep the payment system disabled but structurally complete
* Make future migration to Stripe / NOWPayments / crypto checkout easy

---

## 3. System Architecture

## 3-1. Frontend Responsibilities

The frontend is responsible for:

* Rendering signup, verification, login, account, item, and checkout pages
* Client-side form validation
* Session persistence in a safe frontend-compatible way
* Logged-in / logged-out UI switching
* Calling GAS APIs via API routes or direct WebApp requests
* Handling redirect logic after login/signup

## 3-2. GAS Responsibilities

GAS is responsible for:

* Creating user records
* Validating login attempts
* Sending verification emails
* Storing session tokens
* Returning current user data
* Creating purchase drafts
* Logging events for auditability

## 3-3. Google Sheets Responsibilities

Google Sheets acts as a lightweight database for:

* users
* login_logs
* purchase_drafts
* email_logs
* optional future tables such as items, orders, disputes, notifications

---

## 4. Data Model and Sheet Structure

## 4-1. `users` Sheet

This is the master user table.

Required columns:

* user_id
* created_at
* updated_at
* email
* password_hash
* display_name
* first_name
* last_name
* full_name
* country
* phone
* birth_date
* account_status
* email_verified
* email_verify_code
* email_verify_expire_at
* login_fail_count
* last_login_at
* session_token
* session_expire_at
* avatar_url
* role
* marketing_opt_in
* terms_accepted_at
* privacy_accepted_at

### Field notes

* `user_id`: unique public-safe ID such as `USR_000001`
* `account_status`: `pending_verification`, `active`, `suspended`, `disabled`
* `email_verified`: `true` / `false`
* `role`: default `user`
* `session_token`: current active login token

## 4-2. `login_logs` Sheet

Required columns:

* log_id
* user_id
* email
* login_at
* ip
* user_agent
* result
* reason

`result` examples:

* success
* failed
* blocked
* verify_required

## 4-3. `email_logs` Sheet

Required columns:

* mail_id
* user_id
* email
* type
* code
* sent_at
* result
* meta

`type` examples:

* verify_signup
* resend_verify
* password_reset_future

## 4-4. `purchase_drafts` Sheet

Required columns:

* draft_id
* created_at
* updated_at
* user_id
* item_id
* item_title
* item_price
* currency
* quantity
* status
* checkout_token
* payment_provider
* payment_url
* note

`status` examples:

* pending_payment
* payment_disabled
* expired
* converted_future

---

## 5. GAS API Design

All GAS requests should be routed by an `action` field.

Example request shape:

```json
{
  "action": "signup",
  "payload": {
    "email": "user@example.com"
  }
}
```

All responses must follow this standard:

```json
{
  "ok": true,
  "code": "SUCCESS",
  "message": "Operation completed successfully.",
  "data": {}
}
```

Error example:

```json
{
  "ok": false,
  "code": "EMAIL_ALREADY_EXISTS",
  "message": "An account with this email already exists."
}
```

---

## 6. Account Creation Flow

## 6-1. Goal

Allow a user to create a marketplace account through a polished international signup flow.

## 6-2. Signup Page Route

`/signup`

## 6-3. Signup UI Layout

The page must feel modern and international.

### Recommended structure

* Page title: `Create Your Lootify Account`
* Subtitle: `Join a trusted marketplace in just a few steps.`
* Single centered card layout
* Clean white form area on soft neutral background
* Optional trust bullets beneath title:

  * `Secure registration`
  * `Email verification required`
  * `Protected account access`

## 6-4. Signup Form Fields

Required fields:

* Email Address
* Password
* Confirm Password
* Username
* First Name
* Last Name
* Country
* Phone Number
* Date of Birth
* Checkbox: `I agree to the Terms of Service`
* Checkbox: `I agree to the Privacy Policy`
* Optional Checkbox: `Send me product updates and marketplace news`

CTA button:

* `Create Account`

Secondary link:

* `Already have an account? Sign In`

## 6-5. Frontend Validation Rules

* Email required and valid format
* Password minimum 8 characters
* Password must contain uppercase, lowercase, and number
* Confirm password must match
* Username 3–24 chars
* First name required
* Last name required
* Country required
* Phone required
* DOB required
* Terms checkbox required
* Privacy checkbox required

## 6-6. Backend `signup` Action

### Input

* email
* password
* display_name
* first_name
* last_name
* country
* phone
* birth_date
* marketing_opt_in

### Process

1. Normalize email to lowercase
2. Check for duplicate email in `users`
3. Reject if duplicate exists
4. Hash password before storing
5. Generate `user_id`
6. Generate six-digit verification code
7. Set code expiration to 30 minutes ahead
8. Create user row with `pending_verification`
9. Send verification email
10. Write email send log
11. Return success response with `verify_required = true`

### Success Message

`Your account has been created. Please verify your email to continue.`

---

## 7. Email Verification Flow

## 7-1. Goal

Ensure the email address belongs to the user before allowing marketplace access.

## 7-2. Verification Route

`/verify-email`

## 7-3. Verification Page Copy

Title:

* `Verify Your Email`

Subtitle:

* `Enter the 6-digit verification code sent to your inbox.`

Fields:

* Verification Code

Buttons:

* `Verify Email`
* `Resend Code`

Support text:

* `Didn’t receive the email? Check your spam folder or request a new code.`

## 7-4. Backend `verify_email` Action

### Input

* email
* code

### Process

1. Find user by email
2. Reject if not found
3. Check if already verified
4. Compare verification code
5. Check expiration timestamp
6. On success:

   * set `email_verified = true`
   * set `account_status = active`
   * clear code and expiry
   * update `updated_at`
7. Return success

### Success Message

`Your email has been verified successfully.`

### Error Messages

* `Invalid verification code.`
* `This verification code has expired.`
* `No account was found for this email.`

## 7-5. Backend `resend_verify_code` Action

### Process

1. Locate user
2. Generate new code
3. Update expiry
4. Send email again
5. Append to `email_logs`
6. Return success

### Success Message

`A new verification code has been sent.`

---

## 8. Login Flow

## 8-1. Route

`/login`

## 8-2. Login Page UX Copy

Title:

* `Welcome Back`

Subtitle:

* `Sign in to manage purchases, listings, and account settings.`

Fields:

* Email Address
* Password
* Remember Me (optional)

Buttons / Links:

* `Sign In`
* `Forgot Password?`
* `Create an Account`

## 8-3. Backend `login` Action

### Input

* email
* password
* ip
* user_agent

### Process

1. Find user by email
2. Reject if not found
3. Verify password hash
4. If email not verified, return `VERIFY_REQUIRED`
5. Generate session token
6. Set session expiration (for example 7 days)
7. Update user row
8. Insert login log row
9. Return user summary + session token

### Success Response Data

* user_id
* email
* display_name
* full_name
* avatar_url
* country
* account_status
* email_verified
* session_token

## 8-4. Session Flow

### `me` action

Used to validate a logged-in session.

Input:

* session_token

Process:

1. Search user by session token
2. Check token expiry
3. Return current user profile summary

### `logout` action

Input:

* session_token

Process:

1. Clear token and expiry from user row
2. Return success

---

## 9. Logged-In UI Behavior

## 9-1. Header: Logged-Out State

Show:

* Login
* Sign Up
* Language selector

## 9-2. Header: Logged-In State

Replace Login / Sign Up with:

* Avatar
* Display Name
* Dropdown caret

Optional future icons:

* Notifications
* Wishlist
* Messages

## 9-3. Dropdown Items

When logged in, clicking avatar/name should open a dropdown with:

* My Profile
* My Purchases
* My Listings
* Account Settings
* Sign Out

## 9-4. Where User Details Must Appear

### A. Header Right Section

Always-visible compact identity:

* avatar
* display name

### B. Profile Page

Route: `/account/profile`

Display:

* Avatar
* Display Name
* Full Name
* Email Address
* Country
* Phone Number
* Verification Status
* Member Since
* Last Login
* Account Status

### C. Account Settings Page

Route: `/account/settings`

Editable sections:

* Display Name
* Country
* Phone Number
* Password change
* Marketing preferences

Keep email change disabled or future-scoped for now.

---

## 10. Product Detail Page Specification

## 10-1. Route

`/item/[id]`

## 10-2. UX Goal

The item page must look like a proper international marketplace listing page.

## 10-3. Required Sections

* Main product image
* Item title
* Price block
* Game title / category
* Platform / server info
* Seller mini-profile
* Delivery estimate
* Stock / availability
* Description
* Buy Now button
* Secondary trust labels:

  * `Secure Checkout`
  * `Trusted Marketplace`
  * `Protected Purchase Flow`

## 10-4. Buy Button Behavior

If not logged in:

* redirect to `/login?redirect=/checkout/[itemId]`
  or open login modal then continue

If logged in:

* continue to checkout route

---

## 11. Checkout Flow

## 11-1. Route

`/checkout/[itemId]`

## 11-2. UX Goal

Build a real-looking checkout step, even before payment is enabled.

## 11-3. Layout

Two-column desktop layout:

Left side:

* Item summary
* Seller info
* Delivery note
* Platform note

Right side:

* Price summary card
* Quantity
* Terms acknowledgement
* Continue to Payment button

## 11-4. Checkout Copy

Title:

* `Secure Checkout`

Support lines:

* `Review your item details before continuing.`
* `Your payment will not be processed until you proceed.`

Button:

* `Continue to Payment`

## 11-5. Backend `create_purchase_draft` Action

### Input

* session_token
* item_id
* item_title
* item_price
* currency
* quantity

### Process

1. Validate session token
2. Generate `draft_id`
3. Generate `checkout_token`
4. Insert row into `purchase_drafts`
5. Set `status = pending_payment`
6. Set `payment_provider = disabled`
7. Create mock payment URL
8. Return draft info

### Response Example

```json
{
  "ok": true,
  "code": "PURCHASE_DRAFT_CREATED",
  "message": "Checkout session created successfully.",
  "data": {
    "draft_id": "DRF_000001",
    "checkout_token": "CHK_ABC123",
    "payment_url": "/payment/mock?token=CHK_ABC123"
  }
}
```

---

## 12. Payment-Ready but Disabled Flow

## 12-1. Goal

The system should behave like a payment-ready marketplace even before live payment goes online.

## 12-2. Route

`/payment/mock`

## 12-3. Mock Payment Page Content

Title:

* `Payment Gateway Not Yet Live`

Body copy:

* `Your checkout session has been created successfully.`
* `The payment gateway is currently in test mode and has not been enabled yet.`
* `This marketplace flow is ready for future live payment integration.`

Buttons:

* `Return to Home`
* `Go to My Purchases`

Optional status block:

* Checkout Token
* Draft ID
* Payment Status: `Disabled / Test Mode`

## 12-4. Why This Matters

This preserves the complete purchase structure while allowing payment gateway replacement later with minimal changes.

Future providers may include:

* Stripe
* NOWPayments
* Crypto gateway
* manual invoice flow

---

## 13. Security Requirements

These are mandatory.

### 13-1. Password Handling

* Never store plaintext passwords
* Hash passwords before saving
* Use a repeatable secure hash strategy appropriate for the environment

### 13-2. Verification Code Rules

* Six digits
* Expire after 30 minutes
* Replace old code on resend

### 13-3. Session Rules

* Session token must be random and difficult to predict
* Expiry required
* Invalid session must trigger logout UI state

### 13-4. Abuse Protection

* Track login fail count
* Optionally rate-limit repeated attempts
* Log all attempts in `login_logs`

### 13-5. Data Integrity

* Normalize emails to lowercase
* Ensure all required sheet columns exist
* Reject malformed requests with stable JSON errors

---

## 14. Frontend Page List to Implement

Claude Code should create or complete the following pages/components:

### Pages

* `/signup`
* `/verify-email`
* `/login`
* `/account/profile`
* `/account/settings`
* `/item/[id]`
* `/checkout/[itemId]`
* `/payment/mock`

### Components

* Auth form components
* Verification code component
* Logged-in header menu
* Profile summary card
* Checkout summary card
* Marketplace trust badge component

---

## 15. Recommended User-Facing Copy Library

These phrases should be preferred across the UI.

### Authentication

* `Create Your Account`
* `Secure Sign Up`
* `Verify Your Email`
* `Welcome Back`
* `Sign In to Continue`

### Header / Account

* `My Profile`
* `My Purchases`
* `Account Settings`
* `Sign Out`

### Checkout

* `Secure Checkout`
* `Continue to Payment`
* `Protected Purchase Flow`
* `Trusted Marketplace`

### Empty / Status States

* `No purchases yet.`
* `You are currently signed out.`
* `Verification required before continuing.`
* `Payment is currently in test mode.`

---

## 16. Error Message Standards

Messages must be short, clear, and international.

Use examples like:

* `Please enter a valid email address.`
* `Passwords do not match.`
* `This email is already registered.`
* `Invalid email or password.`
* `Please verify your email before signing in.`
* `Your session has expired. Please sign in again.`
* `Unable to create checkout session.`

Avoid raw system errors in UI.

---

## 17. Implementation Order for Claude Code

Claude Code should implement in this order:

### Phase 1: GAS backend

1. Create sheet helpers
2. Ensure all required sheet columns
3. Implement `signup`
4. Implement `verify_email`
5. Implement `resend_verify_code`
6. Implement `login`
7. Implement `me`
8. Implement `logout`
9. Implement `create_purchase_draft`

### Phase 2: Frontend auth

10. Build `/signup`
11. Build `/verify-email`
12. Build `/login`
13. Wire API integration
14. Persist session token

### Phase 3: Logged-in account UI

15. Update header state
16. Add profile page
17. Add settings page
18. Add dropdown menu

### Phase 4: Checkout flow

19. Complete item detail purchase CTA
20. Build checkout page
21. Connect `create_purchase_draft`
22. Build mock payment page

### Phase 5: Smoke testing

23. Signup test
24. Email verification test
25. Login test
26. Header state test
27. Checkout draft test
28. Mock payment redirect test

---

## 18. Done Criteria

This phase is complete only when all of the following work end-to-end:

1. A new user can sign up through `/signup`
2. A verification code email is sent
3. The code can be submitted on `/verify-email`
4. The verified user can sign in on `/login`
5. The header changes to logged-in state after login
6. The profile page shows actual user data
7. The user can open an item page and click Buy Now
8. The user reaches `/checkout/[itemId]`
9. Clicking `Continue to Payment` creates a purchase draft in Sheets
10. The user is redirected to `/payment/mock`
11. The payment page clearly shows test / disabled status
12. The structure is ready for future live payment integration

---

## 19. Final Instruction to Claude Code

Implement this as a **stable marketplace foundation**, not a demo.

The visual result must feel like an international marketplace platform. The technical result must support future expansion into:

* live payment
* account recovery
* seller onboarding
* real order history
* listing management
* fraud checks
* trust systems

Do not remove existing features unnecessarily. Build on top of the current project with minimal disruption and maximum future compatibility.

This document is intended to be directly executable as an implementation specification.
