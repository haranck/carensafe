import { useState } from "react";
import { getInitials } from "../Layout/HeaderParts/navConfig";

/**
 * Round user avatar: the profile photo (`user.avatarUrl`, e.g. from Google sign-in), else gradient initials.
 * className sets the size and initials text size as full class strings, e.g. "w-8 h-8 text-[12px]".
 * Decorative (alt=""): callers show the name next to it or label the surrounding button.
 */
const UserAvatar = ({ user, className = "" }) => {
    // Remember which URL failed, so a new avatarUrl gets tried again
    const [failedSrc, setFailedSrc] = useState(null);
    const src = user?.avatarUrl;

    if (src && src !== failedSrc) {
        return (
            <img
                src={src}
                alt=""
                aria-hidden="true"
                // Google photo URLs often return 403 when a Referer header is sent
                referrerPolicy="no-referrer"
                onError={() => setFailedSrc(src)}
                className={`flex-shrink-0 rounded-full object-cover bg-violet-50 ${className}`}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={`flex-shrink-0 rounded-full bg-gradient-to-br from-[#3b2a8a] via-[#7c3aed] to-[#d6008a] text-white font-bold flex items-center justify-center ${className}`}
        >
            {getInitials(user)}
        </span>
    );
};

export default UserAvatar;
