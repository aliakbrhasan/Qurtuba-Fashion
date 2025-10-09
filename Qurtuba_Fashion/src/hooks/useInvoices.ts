import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoiceService, InvoiceFormData } from '@/services/invoice.service';
import type { Invoice } from '@/db/database.service';

export function useInvoices() {
  const queryClient = useQueryClient();

  // Query to get all invoices
  const {
    data: invoices = [],
    isLoading: loading,
    error,
    refetch: loadInvoices
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: InvoiceService.getInvoices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to create invoice
  const createInvoiceMutation = useMutation({
    mutationFn: InvoiceService.createInvoice,
    onSuccess: (newInvoice) => {
      // Update the cache with the new invoice
      queryClient.setQueryData(['invoices'], (oldData: Invoice[] = []) => [
        newInvoice,
        ...oldData
      ]);
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
    }
  });

  // Mutation to update invoice
  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Invoice> }) =>
      InvoiceService.updateInvoice(id, updates),
    onSuccess: (updatedInvoice) => {
      // Update the cache with the updated invoice
      queryClient.setQueryData(['invoices'], (oldData: Invoice[] = []) =>
        oldData.map(invoice =>
          invoice.id === updatedInvoice.id ? updatedInvoice : invoice
        )
      );
    },
    onError: (error) => {
      console.error('Error updating invoice:', error);
    }
  });

  // Mutation to delete invoice
  const deleteInvoiceMutation = useMutation({
    mutationFn: InvoiceService.deleteInvoice,
    onSuccess: (_, deletedId) => {
      // Remove the invoice from cache
      queryClient.setQueryData(['invoices'], (oldData: Invoice[] = []) =>
        oldData.filter(invoice => invoice.id !== deletedId)
      );
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
    }
  });

  // Mutation to mark as paid
  const markAsPaidMutation = useMutation({
    mutationFn: InvoiceService.markAsPaid,
    onSuccess: (updatedInvoice) => {
      // Update the cache with the updated invoice
      queryClient.setQueryData(['invoices'], (oldData: Invoice[] = []) =>
        oldData.map(invoice =>
          invoice.id === updatedInvoice.id ? updatedInvoice : invoice
        )
      );
    },
    onError: (error) => {
      console.error('Error marking invoice as paid:', error);
    }
  });

  // Create invoice function
  const createInvoice = async (formData: InvoiceFormData) => {
    // Validate form data
    const validationErrors = InvoiceService.validateInvoiceData(formData);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('\n'));
    }

    return createInvoiceMutation.mutateAsync(formData);
  };

  // Update invoice function
  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    return updateInvoiceMutation.mutateAsync({ id, updates });
  };

  // Delete invoice function
  const deleteInvoice = async (id: string) => {
    return deleteInvoiceMutation.mutateAsync(id);
  };

  // Mark as paid function
  const markAsPaid = async (id: string) => {
    return markAsPaidMutation.mutateAsync(id);
  };

  return {
    invoices,
    loading,
    error: error?.message || null,
    loadInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
  };
}


