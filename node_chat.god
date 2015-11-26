#encoding: utf-8
dir = File.dirname(__FILE__)
 
God.watch do |w|           
  w.name            = "NodeChat"
  w.dir             = "#{dir}"
  w.interval        = 5.seconds
  w.start           = 'node index.js'
  # w.env             = {"QUEUE"=>"*", "RAILS_ENV"=>rails_env}
  w.grace           = 10.seconds  
  w.log             = "#{dir}/log/gnugo.log"   
  w.err_log         = "#{dir}/log/gnugo_error.log"
  
  w.start_if do |start|    
    start.condition(:process_running) do |c|
      c.running = false
    end                    
  end
  
  w.restart_if do |restart|
    restart.condition(:memory_usage) do |c|
      c.above = 110.megabytes
    end
  
    # restart.condition(:http_response_code) do |c|
    #      c.host = 'localhost'
    #      c.port = '8888' 
    #      c.path = '/heartbeat'    
    #      c.code_is_not = %w(200 301 302) 
    # end
  end
end

