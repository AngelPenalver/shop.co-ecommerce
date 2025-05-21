"use client";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAppDispatch } from "../../hook";
import {
  fetchAllProducts,
  setModalLoading,
} from "../../lib/store/features/products/productsSlice";
import { setAlert } from "../../lib/store/features/alert/alertSlice";

export default function FilterBar(): React.JSX.Element {
  //seleccion para ordenamiento
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  //seleccion para filtros
  const [filterBy, setFilterBy] = useState<"name" | "price" | "date">("name");
  const dispatch = useAppDispatch();
  //Aqui escucha el cambio de ordenamiento
  const handleChangesortOrder = (event: SelectChangeEvent<"ASC" | "DESC">) => {
    setSortOrder(event.target.value as "ASC" | "DESC");
  };

  //Aqui escucha el cambio de filtro
  const handleChangeFilterBy = (
    event: SelectChangeEvent<"name" | "price" | "date">
  ) => {
    setFilterBy(event.target.value as "name" | "price" | "date");
  };

  useEffect(() => {
    dispatch(setModalLoading(true));
    dispatch(fetchAllProducts({ sortOrder, filterBy, limit: 12 }))
      .then(() => {
        setTimeout(() => {
          dispatch(setModalLoading(false));
        }, 1300);
      })
      .catch((error) => {
        dispatch(setModalLoading(false));
        dispatch(setAlert({ message: error as string, type: "error" }));
      });
  }, [sortOrder, filterBy, dispatch]);

  return (
    <ul
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        listStyle: "none",
      }}
    >
      <li>
        <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="order-by-select-label">Order By</InputLabel>
          <Select
            labelId="order-by-select-label"
            id="order-by-select"
            value={sortOrder}
            onChange={handleChangesortOrder}
          >
            <MenuItem value={"ASC"}>Ascending</MenuItem>
            <MenuItem value={"DESC"}>Descending</MenuItem>
          </Select>
        </FormControl>
      </li>
      <li>
        <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="filter-by-select-label">Filter By</InputLabel>
          <Select
            labelId="filter-by-select-label"
            id="filter-by-select"
            value={filterBy}
            onChange={handleChangeFilterBy}
          >
            <MenuItem value={"name"}>Name</MenuItem>
            <MenuItem value={"price"}>Price</MenuItem>
            <MenuItem value={"date"}>Date</MenuItem>
          </Select>
        </FormControl>
      </li>
    </ul>
  );
}
