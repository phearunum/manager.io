package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"imanager.io/utils"
)

func main() {
	cfg, db := InitConfigAndDatabase()
	services := InitServices(db, &cfg)

	// Initialize Router, passing gateway components
	router := InitGatewayRoutes(cfg, services)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Println("      \n                   * \n.         * *A* *\n.        *A* **=** *A*\n        *\"\"\"* *|\"\"\"|* *\"\"\"*\n       *|***|* *|*+*|* *|***|*\n*********\"\"\"*___*//+\\\\*___*\"\"\"*********\n@@@@@@@@@@@@@@@@//   \\\\@@@@@@@@@@@@@@@@@\n###############||ព្រះពុទ្ធ||#################\nTTTTTTTTTTTTTTT||ព្រះធម័||TTTTTTTTTTTTTTTTT\nLLLLLLLLLLLLLL//ព្រះសង្ឃ\\\\LLLLLLLLLLLLLLLLL\n៚ សូមប្រោសប្រទានពរឱ្យប្រតិប័ត្តិការណ៍ប្រព្រឹត្តទៅជាធម្មតា ៚ \n៚ ជោគជ័យ   //  ៚សិរីសួរស្តី \\\\   ៚សុវត្តិភាព \n___________//___៚(♨️)៚__\\\\____________\n៚Application Service is Running Port: " + cfg.Service.Port)
		if err := router.Run("0.0.0.0:" + cfg.Service.Port); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-quit
	utils.InfoLog("Server exited cleanly", "")
}
