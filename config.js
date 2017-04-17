
config =
{
    Runtime:
    {
        port: process.env.PORT || 9006,
        adminEmail: 'grant.watters@gmail.com',

        development:
        {
            isProduction: false
        },
        production:
        {
            isProduction: true
        }
    },

    Database:
    {
        URL: process.env.DATABASE_URL
    },

    Mailgun:
    {
        domain: 'mail.gwatters.com',
        key: process.env.MAILGUN_KEY
    }
};
