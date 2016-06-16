'use strict'
console.log('Loading function')

const async = require('async')
const aws = require('aws-sdk')
const dogapi = require('dogapi')
const parse = require('csv').parse

const s3 = new aws.S3({ apiVersion: '2006-03-01' })

const METRIC_NAME = 'aws.cost'

dogapi.initialize({
  api_key: '9e14d243dcebd8c4244574c8fd223659',
  app_key: 'e5495aa7bf1414b1bf429c298dea201eccba63b8'
})

exports.handler = (event, context, callback) => {
  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '))
  const params = {
    Bucket: bucket,
    Key: key
  }
  s3.getObject(params, (err, data) => {
    if (err) {
      console.log(err)
      const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`
      return callback(message)
    }
    const file = data.Body.slice(data.Body.indexOf('\n') + 1)
    parse(file, {columns: true, auto_parse: true}, (err, data) => {
      if (err) {
        console.log('parse error', err)
        console.log('header', data.Body.slice(0, data.Body.indexOf('\n')))
        return callback('error parsing', err)
      }
      async.eachSeries(data, (item, cb) => {
        if (!item.TotalCost ||
          item.RecordType === 'InvoiceTotal' ||
          item.RecordType === 'StatementTotal' ||
          item.RecordType === 'InvoiceTotal' ||
          item.LinkedAccountId === 'EstimatedDisclaimer') {
          return cb()
        }
        const totalCost = item.TotalCost
        const tags = []

        if (item.ProductCode) {
          tags.push('ProductCode:' + item.ProductCode)
          if (item.ProductCode === 'AmazonEC2' &&
              item.UsageType.split(':')[1] &&
              (
                ~item.UsageType.indexOf('USW2-EBSOptimized') ||
                ~item.UsageType.indexOf('USW2-BoxUsage')
              )
            ) {
            tags.push('instance-type:' + item.UsageType.split(':')[1])
          }
        }

        if (item.UsageType) tags.push('UsageType:' + item.UsageType)
        if (item.Operation) tags.push('Operation:' + item.Operation)
        if (item['user:env']) tags.push('env:' + item['user:env'])
        if (item['user:name']) tags.push('name:' + item['user:name'])
        if (item['user:org']) tags.push('org:' + item['user:org'])
        if (item['user:role']) tags.push('role:' + item['user:role'])
        if (item['user:service']) tags.push('service:' + item['user:service'])

        dogapi.metric.send(METRIC_NAME, totalCost, { tags: tags, type: 'gauge' }, (err) => {
          console.log(err, METRIC_NAME, totalCost, { tags: tags, type: 'gauge' })
          cb()
        })
      }, function (err) {
        if (err) {
          console.log('final error', err)
        }
        console.log('ALL DONE')
        callback(err)
      })
    })
  })
}

/** Keys we care about
  ProductCode: 'AmazonEC2',
  UsageType: 'USW2-BoxUsage:m4.large',
  Operation: 'RunInstances',
  TotalCost: 0,
  'user:env': 'production-delta',
  'user:name': '',
  'user:org': 18561043,
  'user:role': 'dock',
  'user:service': ''
*/

/** Example Data
{
  InvoiceID: 'Estimated',
  PayerAccountId: 437258487404,
  LinkedAccountId: 437258487404,
  RecordType: 'PayerLineItem',
  RecordID: '4600000000366627445-13',
  BillingPeriodStartDate: '2016/06/01 00:00:00',
  BillingPeriodEndDate: '2016/06/30 23:59:59',
  InvoiceDate: '2016/06/14 19:25:16',
  PayerAccountName: 'Yash Kumar',
  LinkedAccountName: '',
  TaxationAddress: '1481 FOLSOM ST, SAN FRANCISCO, CA, 94103-3734, US',
  PayerPONumber: '',
  ProductCode: 'AmazonEC2',
  ProductName: 'Amazon Elastic Compute Cloud',
  SellerOfRecord: 'Amazon Web Services, Inc.',
  UsageType: 'USW2-BoxUsage:m4.large',
  Operation: 'RunInstances',
  AvailabilityZone: 'us-west-2c',
  RateId: 8277191,
  ItemDescription: 'Linux/UNIX (Amazon VPC), m4.large instance-hours used this month',
  UsageStartDate: '2016/06/01 00:00:00',
  UsageEndDate: '2016/06/30 23:59:59',
  UsageQuantity: 235.05466601,
  BlendedRate: '',
  CurrencyCode: 'USD',
  CostBeforeTax: 0,
  Credits: 0,
  TaxAmount: 0,
  TaxType: 'None',
  TotalCost: 0,
  'aws:autoscaling:groupName': 'asg-production-delta-18561043',
  'user:autoscaling:groupName': '',
  'user:env': 'production-delta',
  'user:monitored': '',
  'user:name': '',
  'user:org': 18561043,
  'user:os': '',
  'user:role': 'dock',
  'user:service': ''
}
*/
