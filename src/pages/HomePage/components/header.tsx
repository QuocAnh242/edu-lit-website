import { Search, ShoppingCart, MapPin, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useState,useEffect } from 'react';
import axios from 'axios';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PanelLeft } from 'lucide-react';

 

export function Header() {
   const [InputText, setInputText] = useState("");
  const [Users, setUsers] = useState<User[]>([]);
  const [recommendUsers, setRecommendUsers] = useState<User[]>([]);
 interface User {
  id: number;
  name: string;
  email: string;
}
 useEffect(() => {
    handleFetchUsers()
    
    
  },[]);
 
  useEffect(() => {
    handleSearch(InputText);
  }, [InputText]);

  // const handleClick = () => {
  //   if
  // }
  const handleFetchUsers = async () => 
    {
      const response = await axios.get(`https://jsonplaceholder.typicode.com/users`);
      console.log("respone:",response.data);
      setUsers(response.data); 
    };
    const handleSearch = (keyword) => {
      if (keyword.trim() === "") {
        return setRecommendUsers([]);
      }
      else{
        const itemPicker = Users.filter((user) => {
          return user.name.toLowerCase().includes(keyword.toLowerCase());
        });
        setRecommendUsers(itemPicker);
      }
    };
 
  return (
    <header className="bg-gray-900 text-white">
      {/* Top bar */}
      <div className="bg-gray-800 px-4 py-2 text-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>Free shipping on orders over $25</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Customer Service</span>
            <span>Registry</span>
            <span>Gift Cards</span>
            <span>Sell</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center space-x-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold">amazon</h1>
          </div>

          {/* Deliver to */}
          <div className="hidden items-center space-x-1 text-sm md:flex">
            <MapPin className="h-4 w-4" />
            <div>
              <div className="text-xs text-gray-300">Deliver to</div>
              <div className="font-bold">New York 10001</div>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-2xl flex-1 ">
            <div className="flex relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-r-none border-gray-300 bg-gray-200 px-3 text-black"
                  >
                    All
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Departments</DropdownMenuItem>
                  <DropdownMenuItem>Electronics</DropdownMenuItem>
                  <DropdownMenuItem>Books</DropdownMenuItem>
                  <DropdownMenuItem>Home & Garden</DropdownMenuItem>
                  <DropdownMenuItem>Fashion</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            
            <div className="relative w-full">
      <Input
        placeholder="Search Amazon"
        className="w-full rounded-none border-gray-300"
        onChange={(e) => setInputText(e.target.value)}
      />

      {/* 👇 Danh sách gợi ý, đặt absolute trong relative cha */}
      {recommendUsers.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded bg-white text-black shadow">
          {recommendUsers.map((user) => (
            <p key={user.id} className="px-3 py-1 hover:bg-gray-200 cursor-pointer">
              {user.name}
            </p>
          ))}
        </div>
      )}
    </div>
        
              <Button className="rounded-l-none bg-orange-400 px-4 hover:bg-orange-500">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-6">
            {/* Language */}
            <div className="hidden items-center space-x-1 md:flex">
              <span className="text-sm">🇺🇸 EN</span>
            </div>

            {/* Account */}
            <div className="hidden text-sm md:block">
              <div className="text-xs">Hello, sign in</div>
              <div className="font-bold">Account & Lists</div>
            </div>

            {/* Orders */}
            <div className="hidden text-sm md:block">
              <div className="text-xs">Returns</div>
              <div className="font-bold">& Orders</div>
            </div>

            {/* Cart */}
            <div className="flex items-center space-x-1">
              <ShoppingCart className="h-6 w-6" />
              <span className="font-bold">Cart</span>
              <span className="rounded-full bg-orange-400 px-2 py-1 text-xs text-black">
                0
              </span>
            </div>

            {/* Mobile menu */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="bg-gray-800 px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center space-x-6 text-sm">
          {/* <Button variant="ghost" className="p-0 px-2 text-white">
            <Menu className="mr-2 h-4 w-4" />
            All
          </Button> */}
        <SidebarTrigger className="text-white">
  <PanelLeft className="h-4 w-4 text-black" />
  <span className="font-bold text-white">All</span>
</SidebarTrigger>


          <span className="cursor-pointer hover:text-gray-300">
            Today's Deals
          </span>
          <span className="cursor-pointer hover:text-gray-300">
            Customer Service
          </span>
          <span className="cursor-pointer hover:text-gray-300">Registry</span>
          <span className="cursor-pointer hover:text-gray-300">Gift Cards</span>
          <span className="cursor-pointer hover:text-gray-300">Sell</span>
        </div>
      </div>
    </header>
  );
}
