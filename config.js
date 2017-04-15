
config =
{
    Runtime:
    {
        port: process.env.PORT || 9006,

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
        development:
        {
            URL: process.env.DATABASE_URL
        },
        production:
        {
            URL: process.env.DATABASE_URL
        }
    },

    Mailgun:
    {
        domain: 'mail.gwatters.com',

        development:
        {
            key: 'key-bf2bc22e3cde4bda5960ac25d70e939d'
        },
        production:
        {
            key: process.env.MAILGUN_KEY
        }
    }
};
