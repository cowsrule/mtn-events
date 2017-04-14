
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
            URL: 'postgres://zwinxkyliutnum:604528ea1f33d463953d680300814cf9d396e92fdc24c8e6171b914d3527a3df@ec2-54-225-182-108.compute-1.amazonaws.com:5432/d39i2hho72d8uc'
        },
        production:
        {
            URL: process.env.DATABASE_URL
        }
    },
};
