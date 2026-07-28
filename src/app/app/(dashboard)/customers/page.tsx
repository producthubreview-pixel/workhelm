"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  serviceAddress: string | null;
  notes: string | null;
  isArchived: boolean;
  convertedFromLeadId: string | null;
  createdAt: string;
  updatedAt: string;
  estimateCount: number;
};

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (showArchived) params.set("archived", "true");

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  }, [search, showArchived]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  async function handleArchive(id: string) {
    const res = await fetch(`/api/customers/${id}/archive`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      if (updated.isArchived && !showArchived) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      } else {
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isArchived: updated.isArchived } : c))
        );
      }
      toast({
        title: updated.isArchived ? "Customer archived" : "Customer restored",
      });
    } else {
      toast({ title: "Failed to update customer", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Customer deleted" });
    } else {
      toast({ title: "Failed to delete customer", variant: "destructive" });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Link href="/app/customers/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </Link>
      </div>

      {/* Search & Archive Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search name, phone, email, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showArchived ? "default" : "outline"}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? "Hide Archived" : "Show Archived"}
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          Loading customers...
        </div>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-lg text-gray-500 mb-4">
            {showArchived ? "No archived customers found." : "No customers yet."}
          </p>
          {!showArchived && (
            <Link href="/app/customers/new">
              <Button className="gap-1">
                <Plus className="h-4 w-4" /> Add Your First Customer
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Desktop Table */}
      {!loading && customers.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Service Address</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estimates</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      customer.isArchived ? "opacity-60" : ""
                    }`}
                    onClick={() => router.push(`/app/customers/${customer.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {customer.name}
                        {customer.isArchived && (
                          <Badge variant="outline" className="ml-2 text-xs text-gray-400">
                            Archived
                          </Badge>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {customer.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {customer.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">
                      {customer.serviceAddress ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" /> {customer.serviceAddress}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3 text-gray-400" />
                        {customer.estimateCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(customer.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="p-1 rounded hover:bg-gray-200">
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/app/customers/${customer.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/app/customers/${customer.id}/edit`);
                            }}
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(customer.id);
                            }}
                          >
                            {customer.isArchived ? (
                              <>
                                <ArchiveRestore className="h-4 w-4" /> Restore
                              </>
                            ) : (
                              <>
                                <Archive className="h-4 w-4" /> Archive
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(customer.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition ${
                  customer.isArchived ? "opacity-60" : ""
                }`}
                onClick={() => router.push(`/app/customers/${customer.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      {customer.name}
                      {customer.isArchived && (
                        <Badge variant="outline" className="text-xs text-gray-400">
                          Archived
                        </Badge>
                      )}
                    </p>
                    {customer.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {customer.phone}
                      </p>
                    )}
                    {customer.email && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {customer.email}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 rounded hover:bg-gray-100">
                        <MoreHorizontal className="h-5 w-5 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/app/customers/${customer.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/app/customers/${customer.id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(customer.id);
                        }}
                      >
                        {customer.isArchived ? (
                          <>
                            <ArchiveRestore className="h-4 w-4" /> Restore
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4" /> Archive
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(customer.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {customer.serviceAddress && (
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    {customer.serviceAddress}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {customer.estimateCount} estimate
                    {customer.estimateCount !== 1 ? "s" : ""}
                  </span>
                  <span>{formatDate(customer.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
