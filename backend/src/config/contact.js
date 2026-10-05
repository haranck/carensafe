// Contact page topics, shared by the model, Joi validation and the emails (labels are shown in the email)
const CONTACT_TOPICS = {
    order: 'Order help',
    product: 'Product question',
    bulk: 'Bulk order / partnership',
    feedback: 'Feedback',
    other: 'Other'
};

module.exports = { CONTACT_TOPICS, CONTACT_TOPIC_KEYS: Object.keys(CONTACT_TOPICS) };
