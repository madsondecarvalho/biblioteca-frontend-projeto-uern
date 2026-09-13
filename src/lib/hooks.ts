"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getBook,
  getReservation,
  listAuthors,
  listBooks,
  listCategories,
  listCopies,
  listReservations,
  listUsers,
  type BookFilters,
  type CopyFilters,
  type ReservationFilters,
} from "./services";

export function useBooks(filters: BookFilters) {
  return useQuery({
    queryKey: ["books", filters],
    queryFn: () => listBooks(filters),
    placeholderData: keepPreviousData,
  });
}

export function useBook(id: number | string | undefined) {
  return useQuery({
    queryKey: ["books", id],
    queryFn: () => getBook(id as number),
    enabled: id !== undefined && id !== "",
  });
}

export function useAuthors(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["authors", page, limit],
    queryFn: () => listAuthors(page, limit),
    placeholderData: keepPreviousData,
  });
}

export function useAllAuthors() {
  return useQuery({
    queryKey: ["authors", "all"],
    queryFn: () => listAuthors(1, 100),
    staleTime: 60_000,
  });
}

export function useCategories(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["categories", page, limit],
    queryFn: () => listCategories(page, limit),
    placeholderData: keepPreviousData,
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => listCategories(1, 100),
    staleTime: 60_000,
  });
}

export function useCopies(filters: CopyFilters) {
  return useQuery({
    queryKey: ["copies", filters],
    queryFn: () => listCopies(filters),
    placeholderData: keepPreviousData,
  });
}

export function useReservations(filters: ReservationFilters) {
  return useQuery({
    queryKey: ["reservations", filters],
    queryFn: () => listReservations(filters),
    placeholderData: keepPreviousData,
  });
}

export function useReservation(id: number | string | undefined) {
  return useQuery({
    queryKey: ["reservations", id],
    queryFn: () => getReservation(id as number),
    enabled: id !== undefined && id !== "",
  });
}

export function useUsers(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["users", page, limit],
    queryFn: () => listUsers(page, limit),
    placeholderData: keepPreviousData,
  });
}
