import Database from "@ioc:Adonis/Lucid/Database"

export const GetSupplierMs = async () => {
  const row = await Database.connection('mssql')
    .from('vendor')
  return row 
}

export const isExistingSupplierMy = async (vendorCode) => {
  const row = await Database.connection('mysql')
    .from('supplier_header')
    .where('supplier_code', vendorCode)
  return (row.length === 1) ? true : false 
}

export const CreateSupplier = async (
    data, 
    supplier
  ) => {

    const trx = await Database.transaction()
    try {
      const [ supplier_id ] = await trx.table('supplier_header')
      .returning('supplier_id')
      .insert(data)
    
      if(supplier_id) {
        await trx.table('supplier_details')
          .insert({
            supplier_id: supplier_id,
            fax: supplier.fax,
            email: supplier.email,
            phone: supplier.phone,
            contactperson: supplier.contactperson,
            termid: supplier.termid,
            daystodeliver: supplier.daystodeliver,
            tradediscount: supplier.tradediscount,
            cashdiscount: supplier.cashdiscount,
            terms: supplier.terms,
            includeLineDiscounts: supplier.IncludeLineDiscounts,
            discountcode1: supplier.discountcode1,
            discountcode2: supplier.discountcode2,
            discountcode3: supplier.discountcode3,
            discount1: supplier.discount1,
            discount2: supplier.discount2,
            discount3: supplier.discount3,
            daystosum: supplier.daystosum,
            reordermultiplier: supplier.reordermultiplier,
            remarks: supplier.remarks,
            SHAREWITHBRANCH: supplier.SHAREWITHBRANCH,
            Consignor: supplier.Consignor,
            LASTDATEMODIFIED: supplier.LASTDATEMODIFIED,
            TIN: supplier.tin,
            branch_id: 1,
            credit_limit: 0,
            payment_limit: 0
          })
      }
      trx.commit()
    } catch (error) {
      trx.rollback()
      console.log(error.toString(), 'error supplier')
    }
}