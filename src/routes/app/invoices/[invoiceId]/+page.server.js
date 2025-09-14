import { error } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  const { invoiceId } = params
  const { supabase } = locals

  if (!invoiceId) {
    throw error(400, 'Invoice id is required')
  }

  // Get all invoice line items for this invoice
  const { data: invoiceLineItems, error: invoiceLineItemsError } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at')

  if (invoiceLineItemsError) {
    console.error('Failed to fetch invoiceLineItems', invoiceLineItemsError)
    throw error(500, 'Failed to fetch invoiceLineItems')
  }

  // Fetch the invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (invoiceError) {
    console.error('Failed to fetch invoice', invoiceError)
    throw error(500, 'Failed to fetch invoice')
  }

  // Fetch the invoiced shipments
  const { data: invoicedShipments, error: invoicedShipmentsError } = await supabase
    .from('invoiced_shipments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('shipment_date', { ascending: false })

  if (invoicedShipmentsError) {
    console.error('Failed to fetch invoicedShipments', invoicedShipmentsError)
    throw error(500, 'Failed to fetch invoicedShipments')
  }

  return {
    invoice,
    invoiceLineItems,
    invoicedShipments,
    session: locals.session,
  }
}
