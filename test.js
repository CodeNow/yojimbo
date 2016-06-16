const index = require('./index.js')

index.handler({
  Records: [{
    s3: {
      bucket: {
        name: 'anand-aws-billing-report'
      },
      object: {
        key: '437258487404-aws-cost-allocation-2016-01.csv'
      }
    }
  }
  ]
})
