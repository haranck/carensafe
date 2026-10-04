// TODO: DUMMY DATA. Placeholder ratings/reviews for the product page until the reviews API
// (model + GET /user/products/:id/reviews + submit) exists. Replace or remove before going live:
// invented reviews must not be shown to real shoppers.

// Number of ratings per star level
const BREAKDOWN = { 5: 96, 4: 22, 3: 5, 2: 2, 1: 1 };

const total = Object.values(BREAKDOWN).reduce((sum, count) => sum + count, 0);
const average = Object.entries(BREAKDOWN).reduce((sum, [stars, count]) => sum + stars * count, 0) / total;

export const DUMMY_RATING_SUMMARY = {
    average: Math.round(average * 10) / 10,
    total,
    breakdown: BREAKDOWN,
};

export const DUMMY_REVIEWS = [
    {
        id: "dummy-1",
        name: "Priya K.",
        rating: 5,
        date: "21 Sep 2026",
        title: "Soft, and no rashes at all",
        text: "I have sensitive skin and usually get irritation by day two. Not with these. The cotton top feels really soft.",
    },
    {
        id: "dummy-2",
        name: "Sneha M.",
        rating: 5,
        date: "14 Sep 2026",
        title: "No leaks overnight",
        text: "Used the bigger size at night and woke up without any leaks. The wings stay in place too.",
    },
    {
        id: "dummy-3",
        name: "Divya R.",
        rating: 4,
        date: "2 Sep 2026",
        title: "Comfortable, good value",
        text: "Very comfortable through long college days. Would love a slightly bigger pack.",
    },
];
