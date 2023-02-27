import { BRANCH_AUTO, BRANCH_AUTO_API } from './../../Utils/config-auto';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Database from '@ioc:Adonis/Lucid/Database'
import { CheckReceiveTransfer, GetBranches, GetDispatchTransferItems, GetMovements, GetPendingDispatchHeader, GetPosProducts, GetTransferPendingReceive, UpdateDispatchHeaderPosted, UpdateTransferHeader,UpdateStockids } from 'App/Models/StockTransfer'
import axios from 'axios'
import moment from 'moment'
import Env from '@ioc:Adonis/Core/Env'
const API_URL = 'http://' + Env.get('HOST', '') + ':' + Env.get('PORT', '')

export default class AutoImportRrToCvsController {

  public async index({ request }: HttpContextContract) {
    
    const branches = await GetBranches()
	//console.log(branches)
    for (const [key, branch] of branches.entries()) {

      const branchCode = branch.code
      const branchName = branch.name
      const connections = request.connections
      const connection = connections[key]
      
      if(connection.connectionStatus) {
        
         // check if branches is required to auto
        if(BRANCH_AUTO.includes(branchCode)) { 
			console.log(branchName);
          // loop transfers pending for pending auto in
          const myconn = `tenant_my_transfer_${branchCode}`
          const transfers = await GetTransferPendingReceive(branchCode,myconn)
         if(transfers === false){
			 process.exit(0)
		 }
           for(const transfer of transfers) {

            const transfer_id = transfer.id
            const connectionOut = `tenant_my_${transfer.br_code_in}`
            const connectionIn = `tenant_my_${transfer.br_code_in}`
            const connectionMs = `tenant_ms_${transfer.br_code_in}`
            const connectiontransfer = `tenant_my_transfer_${transfer.br_code_in}`

            const index = connections.findIndex((branch) => branch.code === transfer.br_code_in)
            const connectionStatusOut = (typeof connections[index].connectionStatus === "undefined") ? false : connections[index].connectionStatus
           
            // checking if the other branch have a connection
            if(connectionStatusOut) {
             
              const trx = await Database.connection(connectionIn).transaction()
             //
              try {
              // const dispatch =  await GetPendingDispatchHeader(transfer_id, connectionOut)
              //  if (dispatch !== false) {
                  // update posted status if transfer id is already dispatch from other branch
                 /*  if (dispatch.posted === 0) {
                    await UpdateDispatchHeaderPosted(transfer_id, connectionOut) 
                  }   */
                 console.log(transfer_id);
                  const dispatchItems = await GetDispatchTransferItems(transfer_id, connectiontransfer)
                 
                  const receive = await CheckReceiveTransfer(trx, transfer_id)

                  if(receive === false) {

                    // check dispatch item list if they have an error
                    const productError = await this.checkProductError(dispatchItems, connectionMs, branchName, branchCode,connectiontransfer)
                    // save receive transfer if error is empty
                    if(productError.length === 0) {
                      // save receive transfer from dispatch
                      const [ lastInsertId ] = await trx.table('0_receive_transfer')
                      .insert({
                          transfer_id: dispatchItems[0].transfer_id,
                          location_from: transfer.branch_out,
                          date_: moment().format('YYYY-MM-DD'),
                          posted: 0,
                          user_id: 1
                      })
                      
                      for(const item of dispatchItems) {
                        
                        await trx.table('0_receive_transfer_details').insert({ 
                          temp_receiving_id: lastInsertId,
                          prod_id: item.prod_id,
                          barcode: item.barcode,
                          item_name: item.item_name,
                          uom: item.uom,
                          qty: item.qty,
                          status: 0
                        })
                      }
                    }
                    // end save receive transfer if error is empty
                  }
                 await trx.commit()

                  // if receive is already insert into receive transfer call api for auto posting
                    if(receive !== false) {
                    const data = { 
                      p_transfer_no: receive.transfer_id,
                      p_remarks: null,
                      user_id: receive.user_id
                    }
                    
                    const apiUrl = `${BRANCH_AUTO_API[branchCode]}`
                    const res = await axios.post(apiUrl, data)
                    console.log(res.data, 'success api', receive.transfer_id)
                  }   
               // } 
                // end dispatch checking 
              } catch (error) {
                console.log({
                  error: error.toString(), 
                  message: 'error api or code', 
                  transfer_id, 
                  connectionIn, 
                  connectionOut
                })
                await trx.rollback()
              }
            }
            // end checking if the other branch have a connection
          } 
          // end loop transfers pending for pending auto in
        }  
        // end check if branches is required to auto
      }
    }    

    console.log('done')
    return await axios.get(API_URL + '/api/stock_transfer_posting')
  }

  public async checkProductError(dispatchItems, connectionMs, branchName, branchCode,connectiontransfer) {

    const errors:any = []
    for(const item of dispatchItems) {
      const barcode = item.barcode
      const prod_id = item.prod_id
      const products = await GetPosProducts(connectionMs, barcode)
      
      const transfer_id = item.transfer_id
      const uom = item.uom

      
     


      if(products.length === 0) {


        errors.push({
          transfer_id: item.transfer_id,
          barcode: barcode,
          message: `Barcode does not exist (${barcode})  `,
          branch_name: branchName,
          branch_code: branchCode
        })
        console.log(barcode + ' Barcode does not exist')
      }else{

        if(products[0].ProductID != prod_id) {
          console.log(products[0].ProductID+'-@-'+prod_id)
           await UpdateStockids(transfer_id,products[0].ProductID,uom,barcode,connectiontransfer)
        }
        
      }

      if(products.length > 1) {
        errors.push({
          transfer_id: item.transfer_id,
          barcode: barcode,
          message: `OPPSSS BARCODE (${barcode}) is assigned to 2 or more Product ID`,
          branch_name: branchName,
          branch_code: branchCode
        })
        console.log(barcode + ' Barcode does not exist')
      }

      if(products.length === 1) {
        if(products[0].uom !== item.uom) {
          errors.push({
            transfer_id: item.transfer_id,
            barcode: barcode,
            message:  ` (${barcode})  UOM MIS MATCH UOM TRANSFER ${item.uom} UOM POS ${products[0].uom}`,
            branch_name: branchName,
            branch_code: branchCode
          })
          console.log(barcode + `UOM MIS MATCH UOM TRANSFER ${item.uom} UOM POS ${products[0].uom}`)
        }
       
        // console.log(item.prod_id, products[0].ProductID, products[0].Barcode, item.transfer_id)
      }
      
    }

    if(errors.length > 0) {
      await Database.from('0_transfer_error_history')
        .where('transfer_id', errors[0].transfer_id)
        .delete()
      await Database.table('0_transfer_error_history')
        .multiInsert(errors)
    }
    

    return errors
  }

  private async updateTransferPosted (transferId, connectionMs) {
    const movement = await GetMovements(connectionMs, transferId)
    if(movement.length > 0) {
      const data = {
        m_id_in: movement[0].movementid,
        m_no_in: movement[0].movementno,
        name_in: movement[0].postedby,
        transfer_in_date: movement[0].posteddate,
        m_code_in: 'STI',
        aria_trans_no_in: transferId
      }

      await UpdateTransferHeader(transferId, data)
    }
  }
}
