import Database from "@ioc:Adonis/Lucid/Database"

export const GetBranches = async() =>{
  const branches = await Database.from('0_branches_franchisee')
    .where('code', '!=', '')
    .andWhere('ms_mov_host', '!=', '')
    .andWhere('ms_mov_user', '!=', '')
    .andWhere('ms_mov_pass', '!=', '')
    .andWhere('ms_mov_db', '!=', '')
  return branches
}

export const GetTransferPendingReceive = async(code, conmy) => {
 // const row =  await Database
    const row = await Database.connection(conmy
      )
    .from('0_transfer_header as a')
    .select('a.id', 'a.br_code_in', 'b.name as branch_in', 'a.br_code_out', 'c.name as branch_out')
    .innerJoin('0_branches as b', 'a.br_code_in', 'b.code')
    .innerJoin('0_branches as c', 'a.br_code_out', 'c.code')
    .where('br_code_in', code)
    .andWhere('aria_trans_no_out',  "!=", 0)
    .andWhere('aria_type_out', "!=", 0)
    .andWhere('m_id_out', "!=", '')
    .andWhere('aria_trans_no_in', 0)
    .andWhere('aria_type_in', 0)
    .andWhere('m_id_in', '=', '')
    .andWhere('m_no_in', '=', '')
    .andWhere('a.id', '=', '311')
    .whereNotNull('br_code_in')
  
    .orderBy('a.br_code_in', 'desc')
  return row
}

export const GetPendingDispatchHeader = async (transfer_id, connectionName) => {
  const row = await Database.connection(connectionName)

    .from('0_dispatch_transfer')
    .where('transfer_id', transfer_id)
  return row.length > 0 ? row[0] : false
}

export const UpdateDispatchHeaderPosted = async (transfer_id, connectionName) => {
  const result = await Database.connection(connectionName)
    .from('0_dispatch_transfer')
    .where('transfer_id', transfer_id)
    .update({ posted: 1 })
  return result
}

export const GetDispatchTransferItems = async (transfer_id, connectionName) => {
  const row = await Database.connection(connectionName)
    .from('0_transfer_details as a')
    .select('a.transfer_id','a.stock_id_2 as prod_id', 'a.barcode', 'a.description as item_name', 'a.uom', 'a.actual_qty_out as qty')
    .where('a.transfer_id', transfer_id)
    .groupBy('a.barcode', 'a.stock_id_2', 'a.actual_qty_out')
  return row
}

/* export const GetDispatchTransferItems = async (transfer_id, connectionName) => {
  const row = await Database.connection(connectionName)
    .from('0_dispatch_transfer as a')
    .innerJoin('0_dispatch_transfer_details as b', 'a.id', 'b.temp_receiving_id')
    .where('a.transfer_id', transfer_id)
    .andWhere('a.posted', 1)
    .groupBy('b.barcode', 'b.prod_id', 'b.qty')
  return row
}
 */


export const UpdateStockids = async (transfer_id,prod_id,uom,barcode,connectiontransfer) => {
  const result = await Database.connection(connectiontransfer)
    .from('0_transfer_details')
    .where('transfer_id', transfer_id)
          .andWhere('barcode', barcode)
          .andWhere('uom', uom)
          .update({ stock_id_2: prod_id }) 
  return result;
}

export const CheckReceiveTransfer = async (trx, transfer_id) => {
  const row = await trx.from('0_receive_transfer')
    .where('transfer_id', transfer_id)
    .andWhere('posted', 0)
  return (row.length === 0) ? false : row[0]
}

export const GetPosProducts = async(connectionName, barcode) => {
  const row = await Database.connection(connectionName)
    .from('pos_products')
    .where('barcode', barcode)
  return row
}

export const GetMovements = async(connectionName, transfer_id) => {
  const row = await Database.connection(connectionName)
    .from('movements')
    .where('referenceno', `STI-${transfer_id}`)
  return row
}

export const UpdateTransferHeader = async (transfer_id, data) => {
  const row = await Database.from('0_transfer_header')
    .where('id', transfer_id)
    .update(data)
  return row
}