// import { Button } from "@/components/ui/button"
// import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel.tsx";
export function HeroBanner() {
   const banners = [
    {
      title: "Holiday Deals",
      text: "Save up to 70% on top brands and products",
      img: "https://www.allcottonandlinen.com/cdn/shop/articles/holiday-deals.webp?v=1732254687",
    },
    {
      title: "Back to School",
      text: "Everything students need",
      img: "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/back-to-school-special-offer-sale-design-template-13818d16ded417fbca53dc0668bb8b37_screen.jpg?ts=1653381921",
    },
    {
      title: "Spring Collection",
      text: "Fresh styles for the season",
      img: "data:image/jpeg;base64,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",
    },
  ];
  return (
    // <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
    //   <div className="max-w-7xl mx-auto px-4 py-12">
    //     <div className="grid md:grid-cols-2 gap-8 items-center">
    //       <div>
    //         <h2 className="text-4xl font-bold mb-4">Holiday Deals</h2>
    //         <p className="text-xl mb-6">Save up to 70% on top brands and products</p>
    //         <Button size="lg" className="bg-orange-400 hover:bg-orange-500 text-black font-bold">
    //           Shop Now
    //         </Button>
    //       </div>
    //       <div className="relative">
    //         <img src="/placeholder.svg?height=300&width=400" alt="Holiday deals" className="rounded-lg shadow-lg" />
    //       </div>
    //     </div>
    //   </div>

    //   {/* Navigation arrows */}
    //   <Button
    //     variant="ghost"
    //     size="icon"
    //     className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30"
    //   >
    //     <ChevronLeft className="h-6 w-6" />
    //   </Button>
    //   <Button
    //     variant="ghost"
    //     size="icon"
    //     className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30"
    //   >
    //     <ChevronRight className="h-6 w-6" />
    //   </Button>
    // </div>

      <Carousel className="w-full relative">
        <CarouselContent>
          {banners.map((banner, idx) => (
            <CarouselItem key={idx}>
              <div className="grid md:grid-cols-2 gap-8 items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg">
                <div>
                  <h2 className="text-4xl font-bold mb-4">{banner.title}</h2>
                  <p className="text-xl mb-6">{banner.text}</p>
                  <button className="px-6 py-2 bg-orange-400 text-black font-bold rounded hover:bg-orange-500">
                    Shop Now
                  </button>
                </div>
                <div>
                  <img
                    src={banner.img}
                    alt={banner.title}
                    style={{ height: "300px", width: "400px" }}
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation arrows */}
        <CarouselPrevious className="left-4 bg-white/30 text-black hover:bg-white/50" />
        <CarouselNext className="right-4 bg-white/30 text-black hover:bg-white/50" />
      </Carousel>
  )
}
