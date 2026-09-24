/**
 * Centralized Enterprise Error & 404 Middleware
 * Formats all exceptions into a consistent schema and serves a Tomato Sliced 404 page for unmatched routes.
 */

// Custom API Error Class
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ApiError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global 404 Not Found Middleware
 * Intercepts any request that did not match an active route.
 */
const notFoundHandler = (req, res, next) => {
    // 1. If API route or client expects JSON
    if (req.path.startsWith('/api') || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({
            success: false,
            status: 404,
            error: 'Not Found',
            message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
            suggestion: 'Please verify the route URL or consult the FreshCart API specification.',
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        });
    }

    // 2. Browser HTML Request: Serve the signature Sliced Tomato 404 Page
    res.status(404).send(getTomatoSlicedHtml(req.originalUrl));
};

/**
 * Global Error Handler Middleware
 * Normalizes Mongoose, JWT, Validation, and Runtime errors into clean JSON payloads.
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errorType = err.name || 'ServerError';
    let details = err.details || null;

    // 1. Mongoose Validation Error (Schema field requirements failed)
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorType = 'ValidationError';
        const formattedErrors = {};
        for (const [field, fieldError] of Object.entries(err.errors || {})) {
            formattedErrors[field] = fieldError.message;
        }
        details = formattedErrors;
        message = 'Invalid data submitted. Please check the required fields.';
    }

    // 2. Mongoose Cast Error (Invalid ObjectId / data type)
    else if (err.name === 'CastError') {
        statusCode = 400;
        errorType = 'InvalidIdentifier';
        message = `Invalid format for resource identifier '${err.value}' on field '${err.path}'.`;
    }

    // 3. MongoDB Duplicate Key (E11000)
    else if (err.code === 11000) {
        statusCode = 409;
        errorType = 'DuplicateResource';
        const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
        const duplicateValue = err.keyValue ? err.keyValue[duplicateField] : '';
        message = `A record with this ${duplicateField} ('${duplicateValue}') already exists.`;
    }

    // 4. JWT Authorization Errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorType = 'Unauthorized';
        message = 'Authentication failed: Invalid security token.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorType = 'TokenExpired';
        message = 'Session expired: Your access token has expired. Please log in again.';
    }

    // 5. JSON Body Parser Syntax Error
    else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        errorType = 'MalformedJson';
        message = 'Invalid JSON payload received in request body.';
    }

    // Log unexpected 500 server errors
    if (statusCode >= 500) {
        console.error(`[Server Exception] ${req.method} ${req.originalUrl}:`, err.stack || err);
    }

    // JSON response
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        error: errorType,
        message,
        ...(details && { details }),
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack })
    });
};

/**
 * Signature Tomato Sliced 404 HTML Page for Direct Browser Access
 */
function getTomatoSlicedHtml(requestedUrl) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Sliced Away | FreshCart</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --tomato-red: #EF4444;
            --tomato-dark: #DC2626;
            --tomato-deep: #B91C1C;
            --leaf-green: #10B981;
            --bg-color: #0F172A;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: radial-gradient(circle at 50% 30%, #1E293B 0%, #0F172A 100%);
            color: #F8FAFC;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            overflow-x: hidden;
        }
        .container {
            max-width: 680px;
            text-align: center;
            position: relative;
        }
        /* Glow aura */
        .aura {
            position: absolute;
            top: 15%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 320px;
            height: 320px;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.28) 0%, rgba(239, 68, 68, 0) 70%);
            filter: blur(40px);
            z-index: 0;
            pointer-events: none;
        }
        /* Tomato Visual */
        .tomato-stage {
            position: relative;
            z-index: 1;
            margin-bottom: 28px;
            display: inline-block;
        }
        .tomato-top {
            animation: floatTop 3s ease-in-out infinite;
            transform-origin: bottom center;
        }
        .tomato-bottom {
            animation: floatBottom 3s ease-in-out infinite;
            transform-origin: top center;
        }
        .slice-line {
            stroke: #FCD34D;
            stroke-dasharray: 6 6;
            animation: pulseSlice 2s linear infinite;
        }
        .juice-drop {
            animation: drip 2.4s ease-in infinite;
            opacity: 0.85;
        }
        .drop-1 { animation-delay: 0.2s; }
        .drop-2 { animation-delay: 1.1s; }
        .seed {
            animation: floatSeed 3s ease-in-out infinite alternate;
        }
        @keyframes floatTop {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-14px) rotate(-3deg); }
        }
        @keyframes floatBottom {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(14px) rotate(3deg); }
        }
        @keyframes pulseSlice {
            0% { stroke-dashoffset: 0; opacity: 0.8; }
            50% { opacity: 0.3; }
            100% { stroke-dashoffset: 24; opacity: 0.8; }
        }
        @keyframes drip {
            0% { transform: translateY(0) scale(1); opacity: 0.9; }
            70% { transform: translateY(22px) scale(0.9); opacity: 0.8; }
            100% { transform: translateY(35px) scale(0.3); opacity: 0; }
        }
        @keyframes floatSeed {
            0% { transform: translate(0, 0); }
            100% { transform: translate(3px, 4px); }
        }
        /* Badge */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.35);
            color: #FCA5A5;
            padding: 6px 16px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        .badge-dot {
            width: 8px;
            height: 8px;
            background: #EF4444;
            border-radius: 50%;
            box-shadow: 0 0 10px #EF4444;
        }
        h1 {
            font-size: clamp(32px, 6vw, 48px);
            font-weight: 900;
            line-height: 1.15;
            margin-bottom: 14px;
            background: linear-gradient(135deg, #FFFFFF 30%, #FCA5A5 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        p {
            color: #94A3B8;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 28px;
        }
        .url-pill {
            display: inline-block;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            padding: 6px 14px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            color: #FCD34D;
            margin-bottom: 28px;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        /* Buttons */
        .button-group {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: #FFFFFF;
            font-weight: 700;
            font-size: 15px;
            padding: 12px 24px;
            border-radius: 12px;
            text-decoration: none;
            box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
            transition: all 0.2s ease;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 28px -5px rgba(16, 185, 129, 0.55);
        }
        .btn-secondary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.16);
            color: #E2E8F0;
            font-weight: 600;
            font-size: 15px;
            padding: 12px 22px;
            border-radius: 12px;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.14);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="aura"></div>
    <div class="container">
        <!-- Animated Sliced Tomato SVG -->
        <div class="tomato-stage">
            <svg width="220" height="220" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Top Leaf Crown / Calyx -->
                <g class="tomato-top">
                    <!-- Stem & Leaves -->
                    <path d="M100 24 C100 12, 108 8, 114 6 C113 14, 107 20, 102 24 Z" fill="#059669"/>
                    <path d="M100 25 C88 15, 68 18, 62 25 C75 27, 88 28, 98 27 Z" fill="#10B981"/>
                    <path d="M100 25 C112 15, 132 18, 138 25 C125 27, 112 28, 102 27 Z" fill="#10B981"/>
                    <path d="M99 26 C90 32, 78 40, 72 49 C82 43, 93 36, 100 30 Z" fill="#047857"/>
                    <path d="M101 26 C110 32, 122 40, 128 49 C118 43, 107 36, 100 30 Z" fill="#047857"/>

                    <!-- Upper Tomato Half Outer Dome -->
                    <path d="M28 92 C26 65, 52 32, 100 32 C148 32, 174 65, 172 92 Z" fill="url(#tomatoGradient)"/>
                    <ellipse cx="100" cy="92" rx="72" ry="16" fill="#DC2626"/>
                    <ellipse cx="100" cy="92" rx="66" ry="12" fill="#EF4444"/>
                    
                    <!-- Juicy Locule Chambers (Top Slice) -->
                    <path d="M55 89 C55 83, 70 82, 80 87 C74 91, 60 92, 55 89 Z" fill="#991B1B"/>
                    <path d="M145 89 C145 83, 130 82, 120 87 C126 91, 140 92, 145 89 Z" fill="#991B1B"/>
                    <ellipse cx="100" cy="90" rx="14" ry="4" fill="#991B1B"/>
                    <!-- Yellow Seeds -->
                    <ellipse cx="68" cy="87" rx="3.5" ry="2" fill="#FDE047" class="seed"/>
                    <ellipse cx="132" cy="87" rx="3.5" ry="2" fill="#FDE047" class="seed"/>
                </g>

                <!-- Dynamic Slicing Cut Line -->
                <line x1="15" y1="99" x2="185" y2="99" class="slice-line" stroke-width="2.5" stroke-linecap="round"/>

                <!-- Falling Juice Drops -->
                <ellipse cx="78" cy="106" rx="2.5" ry="4.5" fill="#EF4444" class="juice-drop drop-1"/>
                <ellipse cx="122" cy="109" rx="3" ry="5.5" fill="#EF4444" class="juice-drop drop-2"/>

                <!-- Bottom Tomato Half -->
                <g class="tomato-bottom">
                    <!-- Bottom Slice Rim -->
                    <ellipse cx="100" cy="107" rx="72" ry="16" fill="#DC2626"/>
                    <ellipse cx="100" cy="107" rx="66" ry="12" fill="#EF4444"/>

                    <!-- Internal Chambers (Bottom Slice) -->
                    <path d="M55 109 C55 115, 70 116, 80 111 C74 107, 60 106, 55 109 Z" fill="#991B1B"/>
                    <path d="M145 109 C145 115, 130 116, 120 111 C126 107, 140 106, 145 109 Z" fill="#991B1B"/>
                    <ellipse cx="100" cy="108" rx="14" ry="4" fill="#991B1B"/>
                    <!-- Yellow Seeds -->
                    <ellipse cx="68" cy="111" rx="3.5" ry="2" fill="#FDE047" class="seed"/>
                    <ellipse cx="132" cy="111" rx="3.5" ry="2" fill="#FDE047" class="seed"/>

                    <!-- Lower Tomato Half Outer Bowl -->
                    <path d="M28 107 C28 145, 60 174, 100 174 C140 174, 172 145, 172 107 Z" fill="url(#tomatoGradient)"/>
                    <path d="M50 148 C70 166, 130 166, 150 148 C135 158, 65 158, 50 148 Z" fill="#991B1B" opacity="0.3"/>
                </g>

                <!-- Color Gradients -->
                <defs>
                    <radialGradient id="tomatoGradient" cx="40%" cy="30%" r="70%">
                        <stop offset="0%" stop-color="#F87171"/>
                        <stop offset="40%" stop-color="#EF4444"/>
                        <stop offset="85%" stop-color="#DC2626"/>
                        <stop offset="100%" stop-color="#991B1B"/>
                    </radialGradient>
                </defs>
            </svg>
        </div>

        <br>
        <div class="badge">
            <span class="badge-dot"></span>
            Error 404 &bull; Freshly Sliced
        </div>

        <h1>Oops! This Page Got Sliced Away.</h1>
        <p>Looks like someone chopped this page off our grocery counter or it's out of stock. Don't worry, the rest of FreshCart is ripe, fresh, and ready for you!</p>

        <div class="url-pill">Unmatched: ${requestedUrl}</div>

        <div class="button-group">
            <a href="/" class="btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Return to FreshCart
            </a>
            <a href="/shop" class="btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                Browse Catalog
            </a>
        </div>
    </div>
</body>
</html>`;
}

module.exports = {
    ApiError,
    notFoundHandler,
    errorHandler
};
