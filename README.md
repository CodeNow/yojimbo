Yojimbo
=======
Yojimbo is acquired by visiting the Cavern of the Lambda, where the player must place him to become a Lambda function.
Yojimbo acts as a sword-for-hire and has One attack depending on how much the AWS pays him, as well as a AWS tags.
His powerful attack, Datadog Inject, instantly sends cost metric data to Datadog.

![alt tag](http://vignette3.wikia.nocookie.net/finalfantasy/images/a/a8/Yojimbo-artwork-ffx.png/revision/latest?cb=20120623015344)

# TLDR

Lambda Function.
Listens to s3 events. Specifically when billing reports are added.
Parses CSV billing file and pushes total cost with tags to datadog

# Tags

  * ProductCode: 'AmazonEC2',
  * UsageType: 'USW2-BoxUsage:m4.large',
  * Operation: 'RunInstances',
  * TotalCost: 0,
  * 'user:env': 'production-delta',
  * 'user:name': '',
  * 'user:org': 18561043,
  * 'user:role': 'dock',
  * 'user:service': ''

# Deployment

  1. zip files in this directory (not the folder, just the files)
  2. upload to aws lambda Yojimbo function
  3. save
  TODO: make deploy part of ansible
