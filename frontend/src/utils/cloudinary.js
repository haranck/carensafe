const UPLOAD_SEGMENT = "/image/upload/";

const isCloudinaryUrl = (url) => Boolean(url) && url.includes("res.cloudinary.com") && url.includes(UPLOAD_SEGMENT);

// Adds auto format/quality and a max width to Cloudinary URLs; other URLs pass through unchanged
export const cloudinaryUrl = (url, width) => {
    if (!isCloudinaryUrl(url)) return url;
    return url.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}f_auto,q_auto,c_limit,w_${width}/`);
};

export const cloudinarySrcSet = (url, widths) => {
    if (!isCloudinaryUrl(url)) return undefined;
    return widths.map((width) => `${cloudinaryUrl(url, width)} ${width}w`).join(", ");
};
