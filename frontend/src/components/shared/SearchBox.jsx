import React from 'react';
import { Search } from 'lucide-react';

function SearchBox({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <div className="search-box">
      <Search className="search-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-input"
      />
    </div>
  );
}

export default SearchBox;