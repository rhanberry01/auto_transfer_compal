// import cron from 'node-cron'
import rp from 'request-promise'
import Env from '@ioc:Adonis/Core/Env'

// interface CronRequest {
//   url: String,
//   time: String
// }

const API_URL = 'http://' + Env.get('HOST', '') + ':' + Env.get('PORT', '')
function run() {
  rp(API_URL + '/api/stock_transfer_posting')
  .then((data) => {
    console.log(data)
  })
  .catch((err) => {
    console.log('error', err)
  })
}
run();
// const RequestCron = (obj: CronRequest) => {
//   // '*/30 * * * *'
//   cron.schedule(obj.time, function() {
//     rp(obj.url)
//     .then((data) => {
//       console.log(data)
//     })
//     .catch((err) => {
//       console.log('error', err)
//     })
//     console.log('scheduler running ...')
//   })
// }

// const time = '*/10 * * * *'
// RequestCron({ 
//   url: API_URL + '/api/stock_transfer_posting',
//   time: time
// })
